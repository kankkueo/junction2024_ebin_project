import { Viewer } from "../../../viewer";
import { IPlugin } from "../../plugin";
import { Icon } from "./icon";
import { vec3 } from "gl-matrix";
import { IconData } from "./icons-data";
import { VectorUtils } from "../../../common/vector-utils";

export class Icons implements IPlugin {
    private _viewer: Viewer;
    private _icons: HTMLDivElement;
    private _floatdetails: HTMLDivElement;
    private _floatTitle: HTMLDivElement;
    private _floatBody: HTMLDivElement;
    private _instances : { [id: string] : Icon} = {}
    private _selectedIcon: Icon | undefined;
    private _iconsCount = 0;

    init(viewer: Viewer): void {
        this._viewer = viewer;
        this.addStyles();
        const iconsDiv = document.createElement('div');
        iconsDiv.id = 'icons';
        this._icons = iconsDiv;

        const floatdetailsDiv = document.createElement('div');
        floatdetailsDiv.id = 'floatdetails'; 
        
        const floatHeader = document.createElement('div');
        floatHeader.id = 'floatHeader'; 
 
        const floatTitle = document.createElement('div');
        floatTitle.id = 'floatTitle'; 

        floatHeader.appendChild(floatTitle);
        
        const closeBtn = document.createElement('btn');
        closeBtn.id = 'floatCloseBtn'
        closeBtn.addEventListener("click", this.closeFloatingBox.bind(this), false);

        floatHeader.appendChild(closeBtn);

        const floatBody = document.createElement('div');
        floatBody.id = 'floatBody';
        this._floatTitle = floatTitle;
        this._floatBody = floatBody;

        floatdetailsDiv.appendChild(floatHeader);
        floatdetailsDiv.appendChild(floatBody);
        this._floatdetails = floatdetailsDiv;

        iconsDiv.appendChild(floatdetailsDiv);

        const parent = this._viewer.canvas.parentElement;
        if (parent.style.position !== 'relative' && parent.style.position !== 'absolute') {
            parent.style.position = 'relative';
        }

        const parentOfParent = parent.parentElement;
        if (parentOfParent != null) {
            parentOfParent.appendChild(iconsDiv);
        } else {
            parent.appendChild(iconsDiv);
        }

        viewer.on('loaded', args => {
            try {
                window.requestAnimationFrame(() => this.render());
            } catch (e) {
            }
        });

    }

    public addIcon(icon: Icon){
        const id = this.getId(icon);
        const iconElement = document.createElement('div');
        const image = document.createElement('img');
        image.classList.add('icon-image')
        image.addEventListener("click", this.onIconClicked.bind(this), false);
        if(!icon.imageData){
            icon.imageData = IconData.defaultIcon;

        }
        if(!icon.imageData.startsWith('data:image/')){
            image.src = 'data:image/png;base64,' + icon.imageData; // assume it is png
            image.height = icon.height ?? IconData.defaultIconHeight;
            image.width = icon.width ?? IconData.defaultIconWidth;
        }
        else{
            image.src = icon.imageData;
            image.height = 24;
            image.width = 18;
        }
        image.id = id.toString();
        if(!icon.location) {
            const bb : Float32Array = this._viewer.getProductBoundingBox(icon.productId, icon.modelId);
            const wcs = this._viewer.getCurrentWcs();
            const xyz = [bb[0] - wcs[0] + (bb[3] / 2), bb[1] - wcs[1]  + (bb[4] / 2), bb[2] - wcs[2]  + (bb[5] / 2)];
            icon.location = new Float32Array(xyz);
        }
        this._instances[id.toString()] = icon;
        iconElement.id = "icon" + id;
        iconElement.title = `Product ${icon.productId}, Model ${icon.modelId}`;
        iconElement.appendChild(image);
        this._icons.appendChild(iconElement);
        this._iconsCount++;
    }

    private onIconClicked(ev: PointerEvent ){
        ev.stopPropagation();
        const icon: Icon = this._instances[(ev.target as Element).id];
        if(!icon) return;
        if(this._selectedIcon && icon && icon === this._selectedIcon)
        {
            this._selectedIcon = null;
            return;
        }
        if(icon.onIconSelected) icon.onIconSelected(); 
        this._selectedIcon = icon;
    }

    private closeFloatingBox(){
        this._selectedIcon = null;
    }

    private render() {
        const canvas = document.getElementById('viewer');
       
        if(canvas && this._icons) {
    
            // Keep annotation layer in sync with canvas
            this._icons.style.width = canvas.clientWidth + 'px';
            this._icons.style.height = canvas.clientHeight + 'px';

            var wcs = this._viewer.getCurrentWcs();
            var a = this._viewer.getClip()?.PlaneA;
            var b = this._viewer.getClip()?.PlaneB;
            const planeA = a ? this.transformPlane(a, wcs) : null;
            const planeB = b? this.transformPlane(this._viewer.getClip()?.PlaneB, wcs) : null;
            const box = this._viewer.sectionBox.getBoundingBox(wcs);

            Object.getOwnPropertyNames(this._instances).forEach(k => {
                let iconLabel = document.getElementById('icon' + k);
                const icon: Icon = this._instances[k];
                if(iconLabel && icon && icon.location && icon.isEnabled){
                    
                    if(!this.canBeRendered(icon.location, planeA, planeB, box))
                    {
                        iconLabel.style.display = 'none';
                        return;
                    }

                    const position = this._viewer.getHtmlCoordinatesOfVector(icon.location);
                    if(position.length == 2) {

                        const iconheight = icon.height ?? IconData.defaultIconHeight;
                        const iconwidth = icon.width ?? IconData.defaultIconWidth;
                        const posLeft = (position[0]- iconwidth / 2);
                        const posTop =(position[1] - iconheight / 2);
                        iconLabel.style.position = 'absolute';
                        iconLabel.style.display = 'block';
                        iconLabel.style.left = posLeft + 'px';
                        iconLabel.style.top = posTop + 'px';
                    }

                } else {
                    if(iconLabel)
                        iconLabel.style.display = 'none';
                }
            });

            if(this._selectedIcon && this._floatdetails) {
                const position = this._viewer.getHtmlCoordinatesOfVector(this._selectedIcon.location);
                if(position.length == 2) {
                    this._floatTitle.textContent = this._selectedIcon.name;
                    this._floatBody.textContent = this._selectedIcon.description;
                    const posLeft = (position[0]) +(-this._floatdetails.clientWidth / 2) + 10;
                    const posTop =(position[1]) - (this._floatdetails.clientHeight + 24);
                    this._floatdetails.style.left = posLeft + 'px';
                    this._floatdetails.style.top = posTop + 'px';
                    this._floatdetails.style.display = 'block';
                } 
            } else {
                    this._floatdetails.style.display = 'none';
            }
        }
        
        window.requestAnimationFrame(() => this.render());
    }

    private addStyles() { 
        const element = document.createElement('style');
        element.textContent = IconData.styles;
        document.body.appendChild(element);
    }
      
    private getId(icon: Icon): number {
        return this.cantorPairing(this.cantorPairing(icon.productId, icon.modelId), this._iconsCount);
    }
    
    private cantorPairing(x: number, y: number): number {
        return (x + y) * (x + y + 1) / 2 + y;
    }

    private canBeRendered(point: Float32Array, planeA: Float32Array, planeB: Float32Array, box: Float32Array): boolean{

        let canBeRendered = true;

        if(planeA){
            const relPlaneA = this.pointPlaneRelation(planeA[0], planeA[1], planeA[2], planeA[3], point[0], point[1], point[2]);
            canBeRendered = canBeRendered && relPlaneA > 0;
        }

        if(planeB){
            const relPlaneB = this.pointPlaneRelation(planeB[0], planeB[1], planeB[2], planeB[3], point[0], point[1], point[2]);
            canBeRendered = canBeRendered && relPlaneB > 0;
        }

        if(box){
            
            const minX = box[0], minY = box[1], minZ = box[2];
            const maxX = box[0] + box[3], maxY = box[1] + box[4], maxZ = box[2] + box[5];
            canBeRendered = canBeRendered && (point[0] >= minX && point[0] <= maxX &&
                point[1] >= minY && point[1] <= maxY &&
                point[2] >= minZ && point[2] <= maxZ);
        }

        return canBeRendered;
    }


    private pointPlaneRelation(A: number, B: number, C: number, D: number, x1: number, y1: number, z1: number) {
        let result = A * x1 + B * y1 + C * z1 + D;
        result = result / Math.sqrt(A*A + B*B + C*C);
        if (result > 0) {
            return 1; // Point is above the plane
        } else if (result < 0) {
            return -1; // Point is below the plane
        } else {
            return 0; // Point is on the plane
        }
    }

    private transformPlane(plane: number[], transform: vec3): Float32Array {
        const normalLength = vec3.len(VectorUtils.getVec3(plane));
        // plane components
        const a = plane[0];
        const b = plane[1];
        const c = plane[2];
        let d = plane[3];

        // point closest to [0,0,0]
        let x = (a * -d) / normalLength;
        let y = (b * -d) / normalLength;
        let z = (c * -d) / normalLength;

        // translate
        x -= transform[0];
        y -= transform[1];
        z -= transform[2];

        //compute new normal equation of the plane
        d = 0.0 - a * x - b * y - c * z;

        return new Float32Array([a, b, c, d]);
    }

    onBeforeDraw(width: number, height: number): void {
    }
    
    onAfterDraw(width: number, height: number): void {
    }
    
    onBeforeDrawId(): void {
    }
    
    onAfterDrawId(): void {
    }
    
    onAfterDrawModelId(): void {
    }
}