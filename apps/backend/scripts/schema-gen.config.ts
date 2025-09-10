export default {
	schemaDir: "src/server/src/db/schema",
	outputPath: "src/server/src/db/database.types.ts",
	includeElysia: true,
	spreadsImport: "../utils/dizzle.type",
	schemaImport: "./schema/index",
	//   manualConfig: {
	//     userSchema: {
	//       insert: {
	//         password: 't.String({ minLength: 8 })'
	//       }
	//     }
	//   }
};
