attribute vec2 a_position,a_texCoord;varying vec2 v_texCoord;void main(){highp vec4 tmpvar_1;tmpvar_1.zw=vec2(0,1);tmpvar_1.xy=a_position;gl_Position=tmpvar_1;v_texCoord=a_texCoord;}