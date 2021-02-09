const crypto = require("crypto");

const hash = (d) => {
  const hashCrypto = crypto.createHash("sha256");
  hashCrypto.update(d);
  const res = hashCrypto.digest("hex");
  // console.log(res);
  return res;
};

exports.hash = hash;
