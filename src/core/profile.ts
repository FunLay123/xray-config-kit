import { applyPresets } from "../presets/index.js";
import type { CreateProfileInput, Outbound, Profile } from "./types.js";

const defaultOutbounds: Outbound[] = [
  { protocol: "freedom", tag: "direct", settings: { domainStrategy: "AsIs" } },
  { protocol: "blackhole", tag: "block", settings: { response: { type: "none" } } }
];

export function createProfile(input: CreateProfileInput = {}): Profile {
  const { presets, ...profileInput } = input;
  const withPresets = applyPresets(profileInput, presets);
  return normalizeProfile({
    ...withPresets,
    schemaVersion: "xck.v1",
    inbounds: withPresets.inbounds ?? []
  });
}

export function normalizeProfile(profile: Profile): Profile {
  const outbounds = profile.outbounds && profile.outbounds.length > 0 ? profile.outbounds : defaultOutbounds;
  return {
    ...profile,
    schemaVersion: "xck.v1",
    inbounds: profile.inbounds ?? [],
    outbounds
  };
}

