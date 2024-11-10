import numpy
import ifcopenshell
import ifcopenshell.util.placement
import ifcopenshell.util.element
import ifcopenshell.geom
import ifcopenshell.api.root
import ifcopenshell.api.unit
import ifcopenshell.api.context
import ifcopenshell.api.project
import ifcopenshell.api.geometry
import multiprocessing

def collisionExample(model):

    # Introduce some variables to store the beam and column entities
    beamList = []
    columnList = []
    beamCount = 0
    columnCount = 0

#    try:
#        # Load the IFC file
#        model = ifcopenshell.open('/home/jade/coding/Junction2024/ifc_files/import.ifc', '.ifc')
#        print("IFC file opened successfully.")
#    except RuntimeError as e:
#        print(f"Error opening IFC file: {e}")

    # Create a tree
    tree = ifcopenshell.geom.tree()
    # Create a 
    # We want our representation to be the 3D body of the element.
    # This representation context is only created once per project.
    # You must reuse the same body context every time you create a new representation.
    model3d = ifcopenshell.api.context.add_context(model, context_type="Model")
    body = ifcopenshell.api.context.add_context(model,
        context_type="Model", context_identifier="Body", target_view="MODEL_VIEW", parent=model3d)

    # These vertices and faces represent a .2m square .5m high upside down pyramid in SI units.
    # Note how they are nested lists. Each nested list represents a "mesh". There may be multiple meshes.
    vertices = [[(0.,0.,.5), (0.,.2,.5), (.2,.2,.5), (.2,0.,.5), (.1,.1,0.)]]
    faces = [[(0,1,2,3), (0,4,1), (1,4,2), (2,4,3), (3,4,0)]]
    representation = ifcopenshell.api.geometry.add_mesh_representation(model, context=body, vertices=vertices, faces=faces)

    beams = model.by_type("IfcBeam")
    columns = model.by_type("IfcColumn")

    for beam in beams:
        beamList.append(beam.id())
        beamCount += 1
    print("Beam count: ", beamCount)

    for column in columns:
        columnList.append(column.id())
        columnCount += 1
    print("Column count: ", columnCount)

    settings = ifcopenshell.geom.settings()
    iterator = ifcopenshell.geom.iterator(settings, model, multiprocessing.cpu_count(), include= columns + beams)

    if iterator.initialize():
        while True:
            # Use triangulation to build a BVH tree
            tree.add_element(iterator.get())
            if not iterator.next():
                break

    columns_to_beams_clashes = tree.clash_collision_many(
        columns,
        beams,
        allow_touching=True, # Include results where faces merely touch but do not intersect
    )

    cbClashes = len(columns_to_beams_clashes)

    print("Column to Beam clashes: ", cbClashes)

    matrix = numpy.eye(4)

    # Create a new IFC entity for each clash
    # Yoy'll need to have Blender python library (bpy) installed to run this part of the code




    
    for collision in columns_to_beams_clashes:
        matrix[:,3][0:3] = list(collision.p1)

        element = ifcopenshell.api.root.create_entity(model, ifc_class="IfcWall")
        ifcopenshell.api.geometry.edit_object_placement(model, product=element, matrix=matrix) # Edit the object placement of the wall. This represents the position of the wall in the 3D space
        #usage 
        ifcopenshell.api.geometry.assign_representation(model, product=element, representation=representation)# Assign the representation to the wall. This represents the geometry of the wall

    # Save the new IFC file
    model.write('/home/jade/coding/Junction2024/ifc_files/export.ifc')