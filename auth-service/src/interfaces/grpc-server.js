const path = require("node:path");
const grpc = require("@grpc/grpc-js");
const loader = require("@grpc/proto-loader");
const auth = require("../application/auth-service");

function wrap(handler) {
  return async (call, callback) => {
    try {
      callback(null, await handler(call.request));
    } catch (error) {
      const knownError =
        Number.isInteger(error.code) &&
        error.code > 0 &&
        error.code <= 16;

      if (!knownError) console.error(error);

      callback({
        code: knownError ? error.code : grpc.status.INTERNAL,
        details: knownError ? error.message : "Internal server error"
      });
    }
  };
}

function startGrpcServer() {
  const definition = loader.loadSync(
    path.resolve(__dirname, "../../../proto/auth.proto"),
    {
      keepCase: true,
      defaults: true,
      oneofs: true
    }
  );

  const proto = grpc.loadPackageDefinition(definition).auth;
  const server = new grpc.Server();

  server.addService(proto.AuthService.service, {
    register: wrap(auth.register),
    login: wrap(auth.login),
    verifyToken: wrap(auth.verifyToken)
  });

  const address = process.env.GRPC_ADDRESS || "0.0.0.0:50051";

  return new Promise((resolve, reject) => {
    server.bindAsync(
      address,
      grpc.ServerCredentials.createInsecure(),
      (error) => {
        if (error) return reject(error);

        console.log(`Auth gRPC listening on ${address}`);
        resolve(server);
      }
    );
  });
}

module.exports = { startGrpcServer };