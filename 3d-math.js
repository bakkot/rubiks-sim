/**
 * A collection of self-contained math utilities for 3D rotation.
 * Quaternions are represented as [x, y, z, w].
 * 4x4 Matrices are represented as a 16-element Float32Array in column-major order.
 */
export const Math3D = {
  // --- Quaternion Functions ---

  /** Creates an identity quaternion [0, 0, 0, 1] */
  quat_create: function () {
    return [0, 0, 0, 1];
  },

  /**
   * Creates a quaternion from a rotation around an axis.
   * @param {Float32Array} out The receiving quaternion.
   * @param {Array<number>} axis The axis of rotation.
   * @param {number} rad The angle of rotation in radians.
   */
  quat_fromAxisAngle: function (out, axis, rad) {
    const halfAngle = rad / 2;
    const s = Math.sin(halfAngle);
    out[0] = axis[0] * s;
    out[1] = axis[1] * s;
    out[2] = axis[2] * s;
    out[3] = Math.cos(halfAngle);
    return out;
  },

  /**
   * Multiplies two quaternions. Order matters: a * b applies rotation b then a.
   * @param {Float32Array} out The receiving quaternion.
   * @param {Float32Array} a The first operand.
   * @param {Float32Array} b The second operand.
   */
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

  /**
   * Normalizes a quaternion.
   * @param {Float32Array} out The receiving quaternion.
   * @param {Float32Array} q The quaternion to normalize.
   */
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

  // --- Matrix Functions ---

  /**
   * Creates a 4x4 rotation matrix from a quaternion.
   * @param {Float32Array} out The receiving 16-element matrix.
   * @param {Float32Array} q The quaternion.
   */
  mat4_fromQuat: function (out, q) {
    const x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
    const x2 = x + x,
      y2 = y + y,
      z2 = z + z;
    const xx = x * x2,
      xy = x * y2,
      xz = x * z2;
    const yy = y * y2,
      yz = y * z2,
      zz = z * z2;
    const wx = w * x2,
      wy = w * y2,
      wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;

    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;

    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  },

  /**
   * Transforms a 3D vector by a quaternion.
   * @param {Array<number>} out The receiving 3-element vector.
   * @param {Array<number>} v The 3-element vector to transform.
   * @param {Float32Array} q The quaternion to rotate by.
   */
  vec3_transformQuat: function (out, v, q) {
    // This is a standard, optimized method for vector-quaternion rotation.
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
