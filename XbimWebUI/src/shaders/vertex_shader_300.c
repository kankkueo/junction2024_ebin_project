#version 300 es
in highp float aVertexIndex;
in highp float aTransformationIndex;
in highp float aStyleIndex;
in highp float aProduct;
in highp vec2 aState;
in highp vec2 aNormal;

//transformations (model view and perspective matrix)
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

//Highlighting colour
uniform vec4 uHighlightColour;

//Hover-over colour
uniform vec4 uHoverPickColour;

//XRay colour. This has to be semitransparent
uniform vec4 uXRayColour;

//One meter
uniform float uMeter;

// World Coordinate System translation
uniform vec3 uWcs;

//sets if all the colours are only to be used for colour coding of IDs
//this is used for picking
uniform int uColorCoding;

// used for 3 states in x-ray rendering (no x-ray, only highlighted, only non-highlighted as semitransparent)
// NORMAL = 0,
// GRAYSCALE = 1,
// XRAY = 2 (first pass)
// XRAY2 = 3 (second pass)
uniform int uRenderingMode;

//sampler with vertices
uniform highp sampler2D uVertexSampler;
uniform highp float uVertexTextureSize;

//sampler with transformation matrices
uniform highp sampler2D uMatrixSampler;
uniform highp float uMatrixTextureSize;

//sampler with default styles
uniform highp sampler2D uStyleSampler;
uniform highp float uStyleTextureSize;

//sampler with user defined styles
uniform highp sampler2D uStateStyleSampler;

//colour to go to fragment shader
out vec4 vColor;
//varying position used for clipping in fragment shader
out vec3 vPosition;
// varying normal used for shading
out vec3 vNormal;
//state passed to fragment shader
out mediump float vDiscard;

const float PI = 3.1415926535897932384626433832795;

vec3 getNormal(mat4 transform) {
	float U = aNormal[0];
	float V = aNormal[1];
	float lon = U / 252.0 * 2.0 * PI;
	float lat = V / 252.0 * PI;

	float x = sin(lon) * sin(lat);
	float z = cos(lon) * sin(lat);
	float y = cos(lat);

	vec3 normal = vec3(x, y, z);
	if (aTransformationIndex < -0.5) {
		return normalize(normal);
	}

	// TODO: this transformation should be normal = n*M<-1T> (using transposed inverse matrix). 
	// Current implementation will not work correctly for transformations containing scaling.
	// But GL ES 1.0 doesn't contain built-in functions for these matrix operations and most of
	// our transformations are just translations and rotations
	mat3 normTrans = mat3(transform);

	return normalize(vec3(normTrans * normal));
}

vec4 getIdColor(float id) {
	float B = floor(id / (256.0*256.0));
	float G = floor((id - B * 256.0*256.0) / 256.0);
	float R = mod(id, 256.0);
	//
	//}

	return vec4(R / 255.0, G / 255.0, B / 255.0, 1.0);
}

vec2 getTextureCoordinates(int index, int size)
{
    int x = index % size;
    int y = index / size;
	float texSize = float(size);
    float halfTexel = 0.5;
    return (vec2(x, y) + halfTexel) / texSize;;
}

vec4 getColor() { 
	// overriding colour is not defined
	float restyle = aState[1];
	if (restyle > 224.5) {
		int index = int(aStyleIndex);
    	int size = int(uStyleTextureSize);
		vec2 coords = getTextureCoordinates(index, size);
		vec4 col = texture(uStyleSampler, coords);
 
		// gray scale colour mode
		if (uRenderingMode == 1) {
			float intensity = (col.r + col.g + col.b) / 3.0;
			return vec4(intensity, intensity, intensity, col.a);
		}

		// return normal colour
		return col;
	}

	// return colour based on restyle
	// restyling texture is fixed size 15x15 for up to 225 styling colours
	vec2 coords = getTextureCoordinates(int(restyle), 15);
	vec4 col2 = texture(uStateStyleSampler, coords);

	// gray scale colour mode
	if (uRenderingMode == 1) {
		float intensity = (col2.r + col2.g + col2.b) / 3.0;
		return vec4(intensity, intensity, intensity, col2.a);
	}

	return col2;
}

vec4 getVertexPosition(mat4 transform) {
    int index = int(aVertexIndex);
    int size = int(uVertexTextureSize);
    vec2 coords = getTextureCoordinates(index, size);
    vec3 point = texture(uVertexSampler, coords).rgb;

    if (aTransformationIndex < -0.5) {
        return vec4(point, 1.0);
    }

    return transform * vec4(point, 1.0);
}

mat4 getTransform() {
	if (aTransformationIndex < -0.5) {
		return mat4(1.0);
	}

	float tIndex = aTransformationIndex * 4.0;

	// get transformation texture coordinates
	int index = int(tIndex);
    int size = int(uMatrixTextureSize);
	vec2 c1 = getTextureCoordinates(index, size);
	vec2 c2 = getTextureCoordinates(index + 1, size);
	vec2 c3 = getTextureCoordinates(index + 2, size);
	vec2 c4 = getTextureCoordinates(index + 3, size);

	// get transformation matrix components
	vec4 v1 = texture(uMatrixSampler, c1);
	vec4 v2 = texture(uMatrixSampler, c2);
	vec4 v3 = texture(uMatrixSampler, c3);
	vec4 v4 = texture(uMatrixSampler, c4);

	// create transformation matrix
	return mat4(v1, v2, v3, v4);
}

void main(void) {
	int state = int(floor(aState[0] + 0.5));
	vDiscard = 0.0;

	if (state == 254 || // HIDDEN state
		(uColorCoding == -1 && state == 251) || // xray rendering and no selection or 'x-ray visible' state
		(uColorCoding == -1 && (
		(uRenderingMode == 2 && state != 253 && state != 252 && state != 250) || // first of pass x-ray, only highlighted and x-ray visible objects should render
			(uRenderingMode == 3 && (state == 253 || state == 252 || state == 250))) // first of pass x-ray, highlighted and x-ray visible objects should not render
			))
	{
		vDiscard = 1.0;
		vColor = vec4(0.0, 0.0, 0.0, 0.0);
		vNormal = vec3(0.0, 0.0, 0.0);
		vPosition = vec3(0.0, 0.0, 0.0);
		gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	//transform data to simulate camera perspective and position
	mat4 transform = getTransform();
	// apply world coordinate translation to align all models
	vPosition = vec3(getVertexPosition(transform)) + uWcs;
	vNormal = getNormal(transform);

	// normal colour (or overriding)
	vec4 baseColor = getColor();

	//offset semitransparent triangles by 2mm to avoid visual clashes
	if (baseColor.a < 0.98)
	{
		float correction = -0.002;
		if (uColorCoding == -2 || uColorCoding >= 0) {
			correction = -0.02;
		}
		vec3 trans = correction * uMeter * normalize(vNormal);
		vPosition = vPosition + trans;
	}
		
	//product ID colour coding
	if (uColorCoding == -2) {
		// exclude everything except for highlighted and xray visible in xray mode
		if ((uRenderingMode == 2 || uRenderingMode == 4) && state != 252 && state != 253)
		{
			vDiscard = 1.0;
			vColor = vec4(0.0, 0.0, 0.0, 0.0);
			vNormal = vec3(0.0, 0.0, 0.0);	
		} 
		else
		{
			float id = floor(aProduct + 0.5);
			vColor = getIdColor(id);
			vNormal = vec3(0.0, 0.0, 0.0);
		}
	}
	//model ID colour coding
	else if (uColorCoding >= 0) {
		// exclude everything except for highlighted and xray visible in xray mode
		if ((uRenderingMode == 2 || uRenderingMode == 4) && state != 252 && state != 253)
		{
			vDiscard = 1.0;
			vColor = vec4(0.0, 0.0, 0.0, 0.0);
			vNormal = vec3(0.0, 0.0, 0.0);	
		} 
		else
		{
		    float id = float(uColorCoding);
		    vColor = getIdColor(id);
		    vNormal = vec3(0.0, 0.0, 0.0);
		}
	}
	// rendering
	else {
		// get base color or set highlighted colour
		// hoverpick, then highlighted takes precedence over base. Then Xray
		
		if (state == 250) {
			baseColor = uHoverPickColour;
		}
		else if (state == 253) {
			baseColor = uHighlightColour;
		}
		// x-ray mode 
		else if (uRenderingMode == 2 || uRenderingMode == 3) {
			//x-ray visible
			if (state == 252) { 
				baseColor = getColor();
			}
			//x-ray semitransparent light blue colour
			else {
				baseColor = uXRayColour; 
			}
		}
		// pass colour to fragment thader
		vColor = baseColor;
	}

	// transform to GL space
	gl_Position = uPMatrix *  uMVMatrix * vec4(vPosition, 1.0);
}