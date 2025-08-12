export function quat_fromAxisAngle(axis, rad) {
  const halfAngle = rad / 2;
  const s = Math.sin(halfAngle);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(halfAngle)];
}

export function quat_multiply(a, b) {
  const ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  const bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];
  return [
    ax * bw + aw * bx + ay * bz - az * by,
    ay * bw + aw * by + az * bx - ax * bz,
    az * bw + aw * bz + ax * by - ay * bx,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function quat_normalize(q) {
  let len = q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }
  return [q[0] * len, q[1] * len, q[2] * len, q[3] * len];
}

export function vec3_transformQuat(v, q) {
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

  // return v + q.w * uv + cross(q.xyz, uv)
  return [
    vx + qw * uvx + (qy * uvz - qz * uvy),
    vy + qw * uvy + (qz * uvx - qx * uvz),
    vz + qw * uvz + (qx * uvy - qy * uvx),
  ];
}
