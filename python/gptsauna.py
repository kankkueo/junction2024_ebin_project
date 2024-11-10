import ifcopenshell
import ifcopenshell.api
import uuid
import base64
import ifcopenshell.geom

# Load the existing IFC file
ifc_file_path = "./python/input.ifc"
print(f"Loading IFC file from {ifc_file_path}")
model = ifcopenshell.open(ifc_file_path)

# Helper function to create a GUID compatible with IFC format
def generate_guid():
    return base64.urlsafe_b64encode(uuid.uuid4().bytes).decode('utf-8').rstrip('=')

# Check for IfcProject; create if missing
ifc_project = model.by_type("IfcProject")
if not ifc_project:
    ifc_project = model.create_entity("IfcProject", GlobalId=generate_guid(), Name="New Project")
    model.create_entity("IfcRelAggregates", GlobalId=generate_guid(), RelatingObject=ifc_project, RelatedObjects=[])
else:
    ifc_project = ifc_project[0]  # Use existing project

# Check for IfcSite; create if missing and relate it to IfcProject
ifc_site = model.by_type("IfcSite")
if not ifc_site:
    ifc_site = model.create_entity("IfcSite", GlobalId=generate_guid(), Name="Site")
    model.create_entity("IfcRelAggregates", GlobalId=generate_guid(), RelatingObject=ifc_project, RelatedObjects=[ifc_site])
else:
    ifc_site = ifc_site[0]  # Use existing site

# Check for IfcBuilding; create if missing and relate it to IfcSite
ifc_building = model.by_type("IfcBuilding")
if not ifc_building:
    ifc_building = model.create_entity("IfcBuilding", GlobalId=generate_guid(), Name="Building")
    model.create_entity("IfcRelAggregates", GlobalId=generate_guid(), RelatingObject=ifc_site, RelatedObjects=[ifc_building])
else:
    ifc_building = ifc_building[0]  # Use existing building

# Define a unique GUID for the sauna
sauna_id = generate_guid()

# Create the IfcSpace for the sauna
sauna_space = model.create_entity(
    "IfcSpace",
    GlobalId=sauna_id,
    Name="Rooftop Sauna",
    Description="A sauna placed on the roof for relaxation and privacy",
    LongName="Sauna Room",
    ObjectPlacement=model.by_type("IfcLocalPlacement")[0] if model.by_type("IfcLocalPlacement") else None,  # Default placement if available
)

# Link the sauna to the building as a contained space
model.create_entity("IfcRelContainedInSpatialStructure", 
                    GlobalId=generate_guid(), 
                    RelatingStructure=ifc_building, 
                    RelatedElements=[sauna_space])

# Add properties specific to a sauna
property_set = model.create_entity(
    "IfcPropertySet",
    GlobalId=generate_guid(),
    Name="Pset_SaunaProperties",
    HasProperties=[
        model.create_entity("IfcPropertySingleValue", Name="HeatingType", NominalValue=model.create_entity("IfcLabel", "Electric")),
        model.create_entity("IfcPropertySingleValue", Name="MaxTemperature", NominalValue=model.create_entity("IfcReal", 90)),
        model.create_entity("IfcPropertySingleValue", Name="HumidityControl", NominalValue=model.create_entity("IfcBoolean", True)),
    ],
)

# Relate the properties to the sauna space
model.create_entity(
    "IfcRelDefinesByProperties",
    GlobalId=generate_guid(),
    RelatingPropertyDefinition=property_set,
    RelatedObjects=[sauna_space],
)

# Save the modified IFC model
output_ifc_path = "./sauna_model.ifc"
model.write(output_ifc_path)

print(f"Sauna added successfully to {output_ifc_path}")
