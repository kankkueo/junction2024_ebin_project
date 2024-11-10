import ifcopenshell
import ifcopenshell.util.element

def check_all_joints_enhanced(ifc_file_path):
    try:
        # Load the IFC file
        model = ifcopenshell.open(ifc_file_path)
    except RuntimeError as e:
        error_message = str(e)
        if "Type held at index 0 is" in error_message:
            print(f"Error opening IFC file: {error_message}")
            print("This error may be due to an unsupported or corrupted file format. Please ensure the file is a valid IFC file.")
        else:
            print(f"Error opening IFC file: {error_message}")
            print("Please check if the file schema is supported (e.g., IFC2X3 or IFC4).")
        return

    # Determine the schema version
    schema_version = model.schema
    print(f"Schema version detected: {schema_version}")
    
    # Initialize lists to track joint issues
    overlapping_joints = []
    disconnected_elements = []
    missing_connections = []
    misaligned_joints = []
    incompatible_materials = []
    incomplete_geometry = []
    missing_tolerances = []
    
    # Define joint-related entities based on the schema version
    if schema_version == "IFC4":
        joint_entities = {
            "IFCRELINTERFERESELEMENTS": [],  # Available only in IFC4
            "IFCRELCONNECTSWITHREALIZINGELEMENT": [],  # Available only in IFC4
            "IFCRELAGGREGATES": [],
            "IFCRELASSOCIATES": []
        }
    else:  # For IFC2X3, include only entities available in this schema
        joint_entities = {
            "IFCRELAGGREGATES": [],
            "IFCRELASSOCIATES": []
        }
    
    # Collect all joint entities by type
    for entity_type in joint_entities:
        joint_entities[entity_type] = model.by_type(entity_type)
    
    # Check each type of relationship
    for entity_type, entities in joint_entities.items():
        print(f"\nChecking {entity_type} relationships...")
        
        for relationship in entities:
            if hasattr(relationship, 'RelatingElement') and hasattr(relationship, 'RelatedElement'):
                relating_element = relationship.RelatingElement
                related_element = relationship.RelatedElement
                
                if relating_element and related_element:
                    # 1. Check for overlapping using bounding boxes
                    bbox_relating = ifcopenshell.util.element.get_bounding_box(relating_element)
                    bbox_related = ifcopenshell.util.element.get_bounding_box(related_element)
                    
                    if bbox_relating and bbox_related:
                        if (bbox_relating[0] <= bbox_related[1] and bbox_related[0] <= bbox_relating[1] and
                            bbox_relating[2] <= bbox_related[3] and bbox_related[2] <= bbox_relating[3] and
                            bbox_relating[4] <= bbox_related[5] and bbox_related[4] <= bbox_relating[5]):
                            print(f"Overlap Detected in {entity_type}: {relating_element.GlobalId} <--> {related_element.GlobalId}")
                            overlapping_joints.append((relating_element, related_element, entity_type))
                    
                    # 2. Check for alignment
                    direction_relating = relating_element.ObjectPlacement.RelativePlacement.Location
                    direction_related = related_element.ObjectPlacement.RelativePlacement.Location
                    if direction_relating and direction_related:
                        if direction_relating.Coordinates != direction_related.Coordinates:
                            print(f"Misalignment Detected in {entity_type}: {relating_element.GlobalId} <--> {related_element.GlobalId}")
                            misaligned_joints.append((relating_element, related_element, entity_type))
                    
                    # 3. Check for material compatibility
                    relating_material = model.by_guid(relating_element.GlobalId)
                    related_material = model.by_guid(related_element.GlobalId)
                    if relating_material and related_material:
                        if relating_material.Name != related_material.Name:
                            print(f"Incompatible Materials in {entity_type}: {relating_element.GlobalId} ({relating_material.Name}) <--> {related_element.GlobalId} ({related_material.Name})")
                            incompatible_materials.append((relating_element, related_element, entity_type))

                    # 4. Check for missing movement tolerance in expansion joints (IFC4 only)
                    if entity_type == "IFCRELCONNECTSWITHREALIZINGELEMENT" and schema_version == "IFC4" and relationship.Description:
                        if "expansion" in relationship.Description.lower() and "tolerance" not in relationship.Description.lower():
                            print(f"Missing Tolerance in Expansion Joint: {relating_element.GlobalId} <--> {related_element.GlobalId}")
                            missing_tolerances.append((relating_element, related_element, entity_type))
                    
                    # 5. Check for geometry completeness
                    geometry_complete = all(hasattr(relating_element, attr) for attr in ['Representation', 'ObjectPlacement'])
                    if not geometry_complete:
                        print(f"Incomplete Geometry in {entity_type}: {relating_element.GlobalId}")
                        incomplete_geometry.append((relating_element, related_element, entity_type))
                    
                else:
                    # Track missing connections
                    missing_connections.append(relationship)
            else:
                missing_connections.append(relationship)
    
    # Display summary
    print("\nSummary of Joint Analysis:")
    print("Overlapping Joints:")
    for joint in overlapping_joints:
        print(f" - {joint[0].GlobalId} overlaps with {joint[1].GlobalId} in {joint[2]}")
    
    print("\nDisconnected Elements:")
    for elem in disconnected_elements:
        print(f" - {elem[0].GlobalId} disconnected from {elem[1].GlobalId} in {elem[2]}")
    
    print("\nMisaligned Joints:")
    for joint in misaligned_joints:
        print(f" - {joint[0].GlobalId} misaligned with {joint[1].GlobalId} in {joint[2]}")
    
    print("\nIncompatible Materials:")
    for joint in incompatible_materials:
        print(f" - {joint[0].GlobalId} with {joint[1].GlobalId} in {joint[2]}")
    
    print("\nIncomplete Geometry:")
    for geom in incomplete_geometry:
        print(f" - Incomplete geometry in {geom[0].GlobalId} with {geom[1].GlobalId} in {geom[2]}")
    
    print("\nMissing Movement Tolerances:")
    for tolerance in missing_tolerances:
        print(f" - Missing movement tolerance in expansion joint between {tolerance[0].GlobalId} and {tolerance[1].GlobalId}")
    
    print("\nMissing Connections:")
    for connection in missing_connections:
        print(f" - Missing connection in {connection.is_a()} with ID {connection.GlobalId}")
    
    return {
        "overlapping_joints": overlapping_joints,
        "disconnected_elements": disconnected_elements,
        "misaligned_joints": misaligned_joints,
        "incompatible_materials": incompatible_materials,
        "incomplete_geometry": incomplete_geometry,
        "missing_tolerances": missing_tolerances,
        "missing_connections": missing_connections
    }


ifc_file_path = "../ifc_files/exportc"
results = check_all_joints_enhanced(ifc_file_path)
