import { applyPresets } from "../presets/index.js";
import type { CreateProfileInput, JsonObject, Outbound, Profile } from "./types.js";

const defaultOutbounds: Outbound[] = [
  { protocol: "freedom", tag: "direct", settings: { domainStrategy: "AsIs" } },
  { protocol: "blackhole", tag: "block", settings: { response: { type: "none" } } }
];

const defaultPolicy: JsonObject = {
  levels: {
    "0": {
      statsUserOnline: true
    }
  }
};

function applyDefaultPolicy(profile: Partial<Profile>, includeDefaultPolicy: boolean): Partial<Profile> {
  if (!includeDefaultPolicy) return profile;
  return {
    ...profile,
    raw: {
      ...profile.raw,
      topLevel: {
        policy: defaultPolicy,
        ...profile.raw?.topLevel
      }
    }
  };
}

export function createProfile(input: CreateProfileInput = {}): Profile {
  const { presets, includeDefaultPolicy = true, ...profileInput } = input;
  const withPresets = applyDefaultPolicy(applyPresets(profileInput, presets), includeDefaultPolicy);
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
