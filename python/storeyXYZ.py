import ifcopenshell
import ifcopenshell.geom
import ifcopenshell.util.shape
import numpy as np

# This function returns the highest storey's coordinates
def storeyXYZ(model):

    storeys = model.by_type("IfcSlab")
    amount = len(storeys)
    listofZ = [0]*amount
    print("Amount of IfcSlab elements: ", amount)
    maxCoords = [77, 77, -1]
    totx = 0
    toty = 0

    settings = ifcopenshell.geom.settings()
    i = 0
    for storey in storeys:
        storey3d = ifcopenshell.geom.create_shape(settings, storey)
        matrix = np.array(storey3d.transformation.matrix)

        listofZ[i] = matrix[14]
        i += 1
        
        Z = matrix[14]
        X = matrix[12]
        Y = matrix[13]
        totx += X
        toty += Y
        if Z > maxCoords[2]:
            maxCoords[2] = Z
   
    maxCoords[0] = totx/amount
    maxCoords[1] = toty/amount
    return maxCoords, listofZ
  # can be accessed as highStoreyXYZ[0] for the coordinates and highStoreyXYZ[1] for the list of Z coordinates

def generateZlist(model):
    storeys = model.by_type("IfcSlab")
    amount = len(storeys)
    listofZ = [0]*amount
    print("Amount of IfcSlab elements: ", amount)
    settings = ifcopenshell.geom.settings()
    i = 0
    for storey in storeys:
        storey3d = ifcopenshell.geom.create_shape(settings, storey)
        matrix = storey3d.transformation.matrix
        listofZ[i] = matrix[14]
        i += 1
    return listofZ


def heightFinder(Zlist, saunaAmount: int):
    saunaHeight = 2.2
    currentfloor = 0
    i = 0
    Zlast = Zlist[0]
    while currentfloor < (saunaAmount-1) and i < len(Zlist):
        if Zlist[i] <= Zlast - saunaHeight:
            currentfloor += 1
            Zlast = Zlist[i]

        i += 1

    if i == len(Zlist):
        return 0
   
    return Zlast