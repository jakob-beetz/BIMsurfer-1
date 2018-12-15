export default class SSQuad {

    constructor(gl) {
        this.gl = gl;

        let vao = this.vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1., +1.,   -1., -1.,   +1., -1.,
            -1., +1.,   +1., -1.,   +1., +1.
        ]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        let vs_source = `#version 300 es
        layout(location=0) in vec4 vertexPosition;        
        void main() {
            gl_Position = vertexPosition;
        }`;

        let fs_source = `#version 300 es
        precision highp float;
        uniform sampler2D colorAccumulate;
        uniform sampler2D alphaAccumulate;
        out vec4 fragColor;
        void main() {
            ivec2 fragCoord = ivec2(gl_FragCoord.xy);
            float a = texelFetch(alphaAccumulate, fragCoord, 0).r;
            vec4 accum = texelFetch(colorAccumulate, fragCoord, 0);
            fragColor = vec4(accum.rgb / a, clamp(accum.a, 0., 1.));
        }`;

        let vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vs_source);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vs));
        }
        let fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fs_source);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fs));
        }
        let p = this.program = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(p));
        }

        this.colorLocation = gl.getUniformLocation(p, "colorAccumulate");
        this.alphaLocation = gl.getUniformLocation(p, "alphaAccumulate");
    }

    draw(...args) {
        let gl = this.gl;

        gl.disable(gl.DEPTH_TEST);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, args[0]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, args[1]);

        gl.useProgram(this.program);
        gl.uniform1i(this.colorLocation, 1);
        gl.uniform1i(this.alphaLocation, 2);

        gl.bindVertexArray(this.vao);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}