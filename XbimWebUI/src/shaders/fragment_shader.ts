export const fragment_shader = "precision highp float;\r\n\r\nuniform vec4 uClippingPlaneA;\r\nuniform vec4 uClippingPlaneB;\r\nuniform bool uClippingA;\r\nuniform bool uClippingB;\r\n\r\n\r\nuniform vec3 uGBC;\r\n\r\n\r\nuniform vec3 uLight;\r\n\r\n\r\nuniform mat4 uSectionBox;\r\n\r\nvarying vec4 vColor;\r\n\r\nvarying vec3 vPosition;\r\n\r\nvarying vec3 vNormal;\r\n\r\n\r\nvarying float vDiscard;\r\n\r\nvoid main(void) {\r\n \r\n if ( vDiscard > 0.5) discard;\r\n \r\n \r\n vec4 fp = uSectionBox * vec4(vPosition, 1);\r\n if (\r\n fp.x > 1.0 || fp.x < -1.0 || \r\n fp.y > 1.0 || fp.y < -1.0 || \r\n fp.z > 1.0 || fp.z < -1.0) \r\n discard;\r\n\r\n \r\n if (uClippingA)\r\n {\r\n \r\n vec4 p = uClippingPlaneA;\r\n vec3 x = vPosition;\r\n float distance = (dot(p.xyz, x) + p.w) / length(p.xyz);\r\n if (distance < 0.0){\r\n discard;\r\n return;\r\n }\r\n }\r\n\r\n \r\n if (uClippingB)\r\n {\r\n \r\n vec4 p = uClippingPlaneB;\r\n vec3 x = vPosition;\r\n float distance = (dot(p.xyz, x) + p.w) / length(p.xyz);\r\n if (distance < 0.0) {\r\n discard;\r\n return;\r\n }\r\n }\r\n \r\n \r\n if (length(vNormal) < 0.1) {\r\n gl_FragColor = vColor;\r\n return;\r\n }\r\n\r\n \r\n vec3 normalInterp = gl_FrontFacing ? vNormal : -vNormal;\r\n\r\n \r\n float Ka = 1.0; \r\n float Kd = 1.0; \r\n float Ks = 0.2; \r\n float shininessVal = 30.0; \r\n\r\n vec3 ambientColor = vColor.rgb * 0.2; \r\n vec3 diffuseColor = vColor.rgb;\r\n vec3 specularColor = vec3(1.0, 1.0, 1.0);\r\n\r\n vec3 N = normalize(normalInterp);\r\n vec3 L = normalize(uLight - vPosition);\r\n\r\n \r\n float lambertian = max(dot(N, L), 0.0);\r\n\r\n float specular = 0.0;\r\n\r\n if(lambertian > 0.0) {\r\n vec3 R = reflect(-L, N); \r\n \r\n vec3 V = L; \r\n\r\n \r\n float specAngle = max(dot(R, V), 0.0);\r\n specular = pow(specAngle, shininessVal);\r\n }\r\n\r\n vec4 fragColor = vec4(\r\n Ka * ambientColor +\r\n Kd * lambertian * diffuseColor +\r\n Ks * specular * specularColor\r\n , vColor.a\r\n );\r\n\r\n \r\n \r\n fragColor.r = (pow(fragColor.r,uGBC[0]) - 0.5)*uGBC[1] + uGBC[2] + 0.5;\r\n fragColor.g = (pow(fragColor.g,uGBC[0]) - 0.5)*uGBC[1] + uGBC[2] + 0.5;\r\n fragColor.b = (pow(fragColor.b,uGBC[0]) - 0.5)*uGBC[1] + uGBC[2] + 0.5;\r\n\r\n gl_FragColor = fragColor;\r\n}"