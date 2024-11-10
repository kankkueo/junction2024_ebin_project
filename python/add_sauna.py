import numpy
import ifcopenshell
import ifcopenshell.api.root
import ifcopenshell.api.unit
import ifcopenshell.api.context
import ifcopenshell.api.project
import ifcopenshell.api.spatial
import ifcopenshell.api.geometry
import ifcopenshell.api.aggregate
from storeyXYZ import storeyXYZ

def print_model_data(model):
    #prints the data of the model
    #amount of different types of elements
    print("Amount of different types of elements")
    print("Amount of IfcWall elements: ", len(model.by_type("IfcWall")))
    print("Amount of IfcSlab elements: ", len(model.by_type("IfcSlab")))
    print("Amount of IfcBeam elements: ", len(model.by_type("IfcBeam")))
    print("Amount of IfcColumn elements: ", len(model.by_type("IfcColumn")))
    print("Amount of IfcWindow elements: ", len(model.by_type("IfcWindow")))
    print("Amount of IfcDoor elements: ", len(model.by_type("IfcDoor")))
    print("Amount of IfcSpace elements: ", len(model.by_type("IfcSpace")))
    print("Amount of IfcBuilding elements: ", len(model.by_type("IfcBuilding")))
    print("Amount of IfcBuildingStorey elements: ", len(model.by_type("IfcBuildingStorey")))
    print("Amount of IfcBuildingStorey elements: ", len(model.by_type("IfcBuildingStorey")))
    print("Amount of IfcSite elements: ", len(model.by_type("IfcSite")))
    print("Amount of IfcProject elements: ", len(model.by_type("IfcProject")))
    print("Amount of IfcRelAggregates elements: ", len(model.by_type("IfcRelAggregates")))
    print("Amount of IfcRelDefinesByProperties elements: ", len(model.by_type("IfcRelDefinesByProperties")))
    print("Amount of IfcPropertySet elements: ", len(model.by_type("IfcPropertySet")))
    print("Amount of IfcPropertySingleValue elements: ", len(model.by_type("IfcPropertySingleValue")))

def wall_data(model):
    for i in model.by_type("IfcWall"):
        print(i)



def add_wall(model, location, size, angle):


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
    matrix[:3, 3] = location

    # rotation
    th = angle / 180 * numpy.pi
    matrix[0,0] = numpy.cos(th) 
    matrix[0,1] = -numpy.sin(th) 
    matrix[1,0] = numpy.sin(th) 
    matrix[1,1] = numpy.cos(th) 

    # Give our wall a local origin at (0, 0, 0)
    ifcopenshell.api.geometry.edit_object_placement(model, product=wall, matrix=matrix)

    # Add a new wall-like body geometry, 5 meters long, 3 meters high, and 200mm thick
    representation = ifcopenshell.api.geometry.add_wall_representation(model, context=body, length=size[0], height=size[1], thickness=size[2])
    # Assign our new body geometry back to our wall
    ifcopenshell.api.geometry.assign_representation(model, product=wall, representation=representation)
    # Place our wall in the ground floor
    ifcopenshell.api.spatial.assign_container(model, relating_structure=storey, products=[wall])

    return model






def add_sauna(model, zeta):

    # find suitable location
    width = 5; length = 3; height = 2; door = 1; thiccness = 0.2; seat = 0.6; kiuas = 0.6; kiuas_h = 0.8
    [x, y, z] = storeyXYZ(model)[0]
    x -= width
    z = zeta

    model = add_wall(model, [x, y, z], [width-door, height, thiccness], 0)
    model = add_wall(model, [x, y+length, z], [width, height, thiccness], 0)
    model = add_wall(model, [x, y, z], [length, height, thiccness], 90)
    model = add_wall(model, [x+width, y, z], [length, height, thiccness], 90)
    model = add_wall(model, [x-2*thiccness, y, z+height], [width+3*thiccness, thiccness, length+2*thiccness], 0)
    model = add_wall(model, [x, y+length-seat, z+0.5*height], [width, thiccness, seat], 0)
    model = add_wall(model, [x, y+length-2*seat, z+0.25*height], [width, thiccness, seat], 0)
    model = add_wall(model, [x+thiccness+0.05, y+thiccness+0.05, z], [kiuas, kiuas_h, kiuas], 0)

    return model