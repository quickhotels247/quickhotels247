import Box from "@mui/material/Box";
import CardCarousel from "@/components/common/CardCarousel";
import type { PropertyType } from "../../data/types";
import SectionHeader from "@/components/common/SectionHeader";
import PropertyTypeCard from "./PropertyTypeCard";

interface PropertyTypesProps {
  types: PropertyType[];
}

// "Browse by property type": hotels, resorts, villas, apartments, homestays.
export default function PropertyTypes({ types }: PropertyTypesProps) {
  if (!types.length) return null;
  return (
    <Box component="section" aria-labelledby="property-types">
      <SectionHeader id="property-types" title="Browse by property type" />
      <CardCarousel label="Property types" itemWidth={{ xs: "58%", sm: "34%", md: "18.8%" }}>
        {types.map((type) => (
          <PropertyTypeCard key={type.id} type={type} />
        ))}
      </CardCarousel>
    </Box>
  );
}
