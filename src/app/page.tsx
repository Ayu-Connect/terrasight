import MissionControlLayout from "@/components/ui/MissionControlLayout";
import SpatialMap from "@/components/map/SpatialMap";
import CommandInit from "@/components/dashboard/CommandInit";

export default function Home() {
  return (
    <MissionControlLayout>
      <CommandInit />
      <SpatialMap />
    </MissionControlLayout>
  );
}
