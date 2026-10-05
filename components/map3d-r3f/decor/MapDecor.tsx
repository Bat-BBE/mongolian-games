"use client";

import { useMemo } from "react";
import { harvestPlacements } from "./harvestPlacements";
import { BakedInstances } from "./BakedInstances";
import { StationLandmarks } from "../landmarks/StationLandmark";
import type { UrtuuStation } from "@/components/dashboard/UrtuuNode";

export function MapDecor({
  stations,
  currentStationId = "home",
  doneStationIds = [],
}: {
  stations: UrtuuStation[];
  currentStationId?: string;
  doneStationIds?: string[];
}) {
  const placements = useMemo(
    () => harvestPlacements(stations, currentStationId, doneStationIds),
    [stations, currentStationId, doneStationIds],
  );

  return (
    <>
      <BakedInstances glbPath="/models/map/ger_standard.glb" placements={placements.gers} />
      <BakedInstances glbPath="/models/map/tree_01.glb" placements={placements.trees} />
      <BakedInstances glbPath="/models/map/horse.glb" placements={placements.horses} />
      <BakedInstances glbPath="/models/map/camel.glb" placements={placements.camels} />
      <BakedInstances glbPath="/models/map/ovoo.glb" placements={placements.ovoos} />
      <BakedInstances glbPath="/models/map/rock_variant.glb" placements={placements.rocks} />
      <StationLandmarks />
    </>
  );
}
