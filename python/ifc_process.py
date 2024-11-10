
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
import os
from example import create_model
import time
from add_sauna import *
from storeyXYZ import *
import sys


CurrentSauna = int(sys.argv[2])


if sys.argv[1] == "delete" or sys.argv[1] == "create" :
    input = '/home/jade/coding/Junction2024/ifc_files/import.ifc'
else:
    input = '/home/jade/coding/Junction2024/ifc_files/temp.ifc'

temp = '/home/jade/coding/Junction2024/ifc_files/temp.ifc'
converter = "/mnt/d/Coding/DotnetVscode/CreateWexBIM/publish/CreateWexBIM.exe"
output_file = "/home/jade/coding/Junction2024/ifc_files/output.wexbim"



try:
    # Load the IFC file
    model = ifcopenshell.open(input, '.ifc')
    if model != None: print("IFC file opened successfully.")
except RuntimeError as e:
    print(f"Error opening IFC file: {e}")

zlist = generateZlist(model) # generate the list of Z coordinates
if zlist == None:
    print('its fucking shit')
zlist.sort(reverse=True) # sort the list




# if sauna is to be added
if sys.argv[1] != 'delete':
    print('Adding the fucking sauna!!!')
    
    height = heightFinder(zlist, CurrentSauna)
    model = add_sauna(model, height) # add the sauna to the model at the calculated height


model.write(temp)

# Convert the IFC file to WexBIM
timer = time.time()
print (f"Converting file...")
os.system(f"{converter} {temp} {output_file}")
time = time.time() - timer
print(f'Conversion done,  took {time:.3} seconds')
print(f'File Size in MegaBytes is {os.stat(output_file).st_size / (1024 * 1024):.3}')
