import { Icons } from './icons'

/**
 * Represents an icon that can be rendered using the Icons plugin
 * 
 * @see Icons
 */
export class Icon {
    private _modelId: number;
    private _productId: number;
    private _location: Float32Array;
    private _imageData: string;
    private _description: string;
    private _name: string;
    private _width: number;
    private _height: number;
    private _enabled: boolean;
    private _onIconSelected: () => void;
    
    /**
     * Creates an instance of Icon.
     * 
     * @param {string} name - The name of the icon.
     * @param {string} description - A brief description of the icon.
     * @param {number} modelId - The model ID associated with the icon.
     * @param {number} productId - The product ID associated with the icon.
     * @param {string} imageData - Base64 encoded image data for the icon.
     * @param {Float32Array | null} [location=null] - The XYZ coordinates for the icon location. If not provided, the centroid of the product bounding box is used.
     * @param {number | null} [width=null] - The width of the icon. If null, default width is used.
     * @param {number | null} [height=null] - The height of the icon. If null, default height is used.
     * @param {() => void} [onIconSelected=null] - Callback function to be executed when the icon is selected.
     * @example
     * const icon = new Icon('Sample Icon', 'This is a sample icon.', 1, 101, 'imageDataString', new Float32Array([0, 0, 0]), 100, 100, () => console.log('Icon selected'));
     */
    constructor(
        name: string,
        description: string,
        modelId: number,
        productId: number,
        imageData: string | null,
        location: Float32Array | null = null,
        width: number | null = null,
        height: number | null = null,
        onIconSelected: () => void = null
    ) {
        this._modelId = modelId;
        this._productId = productId;
        this._imageData = imageData;
        this._location = location;
        this._name = name;
        this._description = description;
        this._width = width;
        this._height = height;
        this._onIconSelected = onIconSelected;
        this._enabled = true;
    }

    /**
     * Gets the model ID associated with the icon.
     * @returns {number} The model ID.
     */
    public get modelId(): number {
        return this._modelId;
    }

    /**
     * Gets the product ID associated with the icon.
     * @returns {number} The product ID.
     */
    public get productId(): number {
        return this._productId;
    }

    /**
     * Gets the location of the icon.
     * @returns {Float32Array} The XYZ coordinates of the icon.
     */
    public get location(): Float32Array {
        return this._location;
    }

    /**
     * Sets the location of the icon.
     * @param {Float32Array} value - The new XYZ coordinates for the icon.
     */
    public set location(value: Float32Array) {
         this._location = value;
    }

    /**
     * Gets the Base64 encoded image data of the icon.
     * @returns {string} The Base64 encoded image data.
     */
    public get imageData(): string {
        return this._imageData;
    }

    /**
     * Sets the Base64 encoded image data of the icon.
     * @param {string} value - The new Base64 encoded image data.
     */
    public set imageData(value: string) {
        this._imageData = value;
    }

    /**
     * Gets the name of the icon.
     * @returns {string} The name of the icon.
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Sets the name of the icon.
     * @param {string} value - The new name of the icon.
     */
    public set name(value: string) {
        this._name = value;
    }

    /**
     * Gets the description of the icon.
     * @returns {string} The description of the icon.
     */
    public get description(): string {
        return this._description;
    }

    /**
     * Sets the description of the icon.
     * @param {string} value - The new description of the icon.
     */
    public set description(value: string) {
        this._description = value;
    }

    /**
     * Gets the width of the icon.
     * @returns {number} The width of the icon.
     */
    public get width(): number {
        return this._width;
    }

    /**
     * Sets the width of the icon.
     * @param {number} value - The new width of the icon.
     */
    public set width(value: number) {
        this._width = value;
    }

    /**
     * Gets the height of the icon.
     * @returns {number} The height of the icon.
     */
    public get height(): number {
        return this._height;
    }

    /**
     * Sets the height of the icon.
     * @param {number} value - The new height of the icon.
     */
    public set height(value: number) {
        this._height = value;
    }

    /**
     * Gets the callback function to be executed when the icon is selected.
     * @returns {() => void} The callback function.
     */
    public get onIconSelected(): () => void {
        return this._onIconSelected;
    }

    /**
     * Gets a boolean value indicating if this icon is enabled
     * @returns {boolean} a value indicates if this icon is enabled.
     */
    public get isEnabled(): boolean {
        return this._enabled;
    }

     /**
     * Sets if this icon is enabled or not
     * @param {boolean} value - a value indicates if this icon is enabled.
     */
    public set isEnabled(value: boolean) {
        this._enabled = value;
    }
}
