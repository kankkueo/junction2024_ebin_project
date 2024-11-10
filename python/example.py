import ifcopenshell.api.root
import ifcopenshell.api.unit
import ifcopenshell.api.context
import ifcopenshell.api.project
import ifcopenshell.api.spatial
import ifcopenshell.api.geometry
import ifcopenshell.api.aggregate
import numpy

# Create a blank model
def create_model(model):

    # Let's create a modeling geometry context, so we can store 3D geometry (note: IFC supports 2D too!)
    context = ifcopenshell.api.context.add_context(model, context_type="Model")

    # In particular, in this example we want to store the 3D "body" geometry of objects, i.e. the body shape
    body = ifcopenshell.api.context.add_context(model, context_type="Model",
        context_identifier="Body", target_view="MODEL_VIEW", parent=context)

    # Create a site, building, and storey. Many hierarchies are possible.
    site = model.by_type("IfcSite")[0] if model.by_type("IfcSite") else \
        ifcopenshell.api.root.create_entity(model, ifc_class="IfcSite", name="Site 0")

    building = model.by_type("IfcBuilding")[0] if model.by_type("IfcBuilding") else \
        ifcopenshell.api.root.create_entity(model, ifc_class="IfcBuilding", name="Building 0")

    storey = model.by_type("IfcBuildingStorey")[0] if model.by_type("IfcBuildingStorey") else \
        ifcopenshell.api.root.create_entity(model, ifc_class="IfcBuildingStorey", name="Ground Floor")

    # Let's create a new wall
    wall = ifcopenshell.api.root.create_entity(model, ifc_class="IfcWall")

    matrix = numpy.eye(4)
    x = 0
    y = 0
    z = 0
    matrix[:3, 3] = [x, y, z]

    # Give our wall a local origin at (0, 0, 0)
    ifcopenshell.api.geometry.edit_object_placement(model, product=wall, matrix=matrix)

    # Add a new wall-like body geometry, 5 meters long, 3 meters high, and 200mm thick
    representation = ifcopenshell.api.geometry.add_wall_representation(model, context=body, length=1, height=1, thickness=0.1)
    # Assign our new body geometry back to our wall
    ifcopenshell.api.geometry.assign_representation(model, product=wall, representation=representation)
    # Place our wall in the ground floor
    ifcopenshell.api.spatial.assign_container(model, relating_structure=storey, products=[wall])


    return model