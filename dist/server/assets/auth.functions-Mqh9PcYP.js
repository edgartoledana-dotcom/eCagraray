import { T as TSS_SERVER_FUNCTION, c as createServerFn } from "./server-D33WmEg_.js";
import { z } from "zod";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const loginUser_createServerFn_handler = createServerRpc({
  id: "07fd746ed5ac20e1b8ea1aa3717bc499703f6cbd93934e8807c3cae6171ed915",
  name: "loginUser",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => loginUser.__executeServer(opts));
const loginUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})).handler(loginUser_createServerFn_handler, async ({
  data
}) => {
  const {
    authenticateUser
  } = await import("./auth.server-U47ksnFH.js");
  return authenticateUser(data.username, data.password);
});
const registerUser_createServerFn_handler = createServerRpc({
  id: "a4d5f5a4f2ec96c748880357232e2f30c2244ab48f011829d405ab7974704abe",
  name: "registerUser",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => registerUser.__executeServer(opts));
const registerUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  fullName: z.string().min(1),
  email: z.string().email(),
  contact: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  role: z.string().optional()
})).handler(registerUser_createServerFn_handler, async ({
  data
}) => {
  const {
    createUser: createUser2
  } = await import("./auth.server-U47ksnFH.js");
  return createUser2(data);
});
const fetchUserById_createServerFn_handler = createServerRpc({
  id: "53f20a07b833da260adfb175220b11595a2c3924f25fec110c43847e02fd1a6b",
  name: "fetchUserById",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => fetchUserById.__executeServer(opts));
const fetchUserById = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string().min(1)
})).handler(fetchUserById_createServerFn_handler, async ({
  data
}) => {
  const {
    getUserById
  } = await import("./auth.server-U47ksnFH.js");
  return getUserById(data.id);
});
const getUsers_createServerFn_handler = createServerRpc({
  id: "8845ac478586285554d771cbf1fa8649a2393ffffb67f7701638eb58b3d3d28b",
  name: "getUsers",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => getUsers.__executeServer(opts));
const getUsers = createServerFn({
  method: "POST"
}).handler(getUsers_createServerFn_handler, async () => {
  const {
    getAllUsers
  } = await import("./auth.server-U47ksnFH.js");
  return getAllUsers();
});
const createUser_createServerFn_handler = createServerRpc({
  id: "7c32f1a232999d4fc237299afb9601b9632936941d92344e932993f290f24292",
  name: "createUser",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => createUser.__executeServer(opts));
const createUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional()
})).handler(createUser_createServerFn_handler, async ({
  data
}) => {
  const {
    createUser: createServerUser
  } = await import("./auth.server-U47ksnFH.js");
  return createServerUser(data);
});
const updateUser_createServerFn_handler = createServerRpc({
  id: "106acd4476525a06d341ab5771303b58c4c1ce7280b4a14212cdd8fa7fe6c178",
  name: "updateUser",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => updateUser.__executeServer(opts));
const updateUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  contact: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  password: z.string().min(8).optional()
})).handler(updateUser_createServerFn_handler, async ({
  data
}) => {
  const {
    updateUser: updateServerUser
  } = await import("./auth.server-U47ksnFH.js");
  return updateServerUser(data);
});
const deleteUser_createServerFn_handler = createServerRpc({
  id: "4ee61fedef4b9d403e6bb2e6d0bd270ff7f6e42ab4a6b5e27c3a43b9e32c2626",
  name: "deleteUser",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => deleteUser.__executeServer(opts));
const deleteUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string().min(1)
})).handler(deleteUser_createServerFn_handler, async ({
  data
}) => {
  const {
    deleteUser: removeUser
  } = await import("./auth.server-U47ksnFH.js");
  return removeUser(data.id);
});
const getBarangayInfo_createServerFn_handler = createServerRpc({
  id: "872b2fabe1d0c8390ead52530860cef4f4b112210fc576de3d06f5487714e9d0",
  name: "getBarangayInfo",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => getBarangayInfo.__executeServer(opts));
const getBarangayInfo = createServerFn({
  method: "POST"
}).handler(getBarangayInfo_createServerFn_handler, async () => {
  const {
    getBarangayInfo: getInfo
  } = await import("./auth.server-U47ksnFH.js");
  return getInfo();
});
const saveBarangayInfo_createServerFn_handler = createServerRpc({
  id: "fa550cc94fba4ef4334e9b1dfa9d23295b0fc64ed037453cc2b68e2d69b32f62",
  name: "saveBarangayInfo",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => saveBarangayInfo.__executeServer(opts));
const saveBarangayInfo = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  name: z.string().optional(),
  municipality: z.string().optional(),
  province: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  captain: z.string().optional()
})).handler(saveBarangayInfo_createServerFn_handler, async ({
  data
}) => {
  const {
    saveBarangayInfo: saveInfo
  } = await import("./auth.server-U47ksnFH.js");
  return saveInfo(data);
});
const getDashboardStats_createServerFn_handler = createServerRpc({
  id: "34738005489fde5aa6d7b80c64d12e87441b51878ed082a1ec30b39b12976a27",
  name: "getDashboardStats",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => getDashboardStats.__executeServer(opts));
const getDashboardStats = createServerFn({
  method: "POST"
}).handler(getDashboardStats_createServerFn_handler, async () => {
  const {
    getDashboardStats: getStats
  } = await import("./auth.server-U47ksnFH.js");
  return getStats();
});
const updateUserProfile_createServerFn_handler = createServerRpc({
  id: "834df8808103af5bf7d20233dde3c064d6e3366b832d9ac1ec0d1c56e45a73cf",
  name: "updateUserProfile",
  filename: "src/lib/api/auth.functions.ts"
}, (opts) => updateUserProfile.__executeServer(opts));
const updateUserProfile = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  contact: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional()
})).handler(updateUserProfile_createServerFn_handler, async ({
  data
}) => {
  const {
    updateUserProfile: updateUserProfile2
  } = await import("./auth.server-U47ksnFH.js");
  return updateUserProfile2(data);
});
export {
  createUser_createServerFn_handler,
  deleteUser_createServerFn_handler,
  fetchUserById_createServerFn_handler,
  getBarangayInfo_createServerFn_handler,
  getDashboardStats_createServerFn_handler,
  getUsers_createServerFn_handler,
  loginUser_createServerFn_handler,
  registerUser_createServerFn_handler,
  saveBarangayInfo_createServerFn_handler,
  updateUserProfile_createServerFn_handler,
  updateUser_createServerFn_handler
};
