export const Math3D = {
  quat_fromAxisAngle: function (axis, rad) {
    const halfAngle = rad / 2;
    const s = Math.sin(halfAngle);
    return [
      axis[0] * s,
      axis[1] * s,
      axis[2] * s,
      Math.cos(halfAngle),
    ];
  },

  quat_multiply: function (out, a, b) {
    const ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
    const bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];
    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
  },

  quat_normalize: function (out, q) {
    let len = q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = q[0] * len;
    out[1] = q[1] * len;
    out[2] = q[2] * len;
    out[3] = q[3] * len;
    return out;
  },

  vec3_transformQuat: function (out, v, q) {
    const qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];
    const vx = v[0],
      vy = v[1],
      vz = v[2];

    // Calculate uv = 2 * cross(q.xyz, v)
    const uvx = 2 * (qy * vz - qz * vy);
    const uvy = 2 * (qz * vx - qx * vz);
    const uvz = 2 * (qx * vy - qy * vx);

    // out = v + q.w * uv + cross(q.xyz, uv)
    out[0] = vx + qw * uvx + (qy * uvz - qz * uvy);
    out[1] = vy + qw * uvy + (qz * uvx - qx * uvz);
    out[2] = vz + qw * uvz + (qx * uvy - qy * uvx);
    return out;
  },
};
