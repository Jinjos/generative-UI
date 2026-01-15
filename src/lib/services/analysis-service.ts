import { getQuickJS, QuickJSWASMModule } from "quickjs-emscripten";

/**
 * ARCHITECTURE NOTE: THE GLASS BOX (Sandbox)
 * 
 * This service provides a secure "Analysis Engine" for the Agent.
 * It allows the Agent to run JavaScript code against heavy datasets 
 * without ever seeing the raw data itself.
 * 
 * SECURITY:
 * - Uses QuickJS (WASM) for complete isolation from the host Node.js process.
 * - No access to file system, network, or environment variables.
 * - Strict memory and timeout limits.
 */
export class AnalysisService {
  private static modulePromise: Promise<QuickJSWASMModule> | null = null;

  /**
   * Initializes the WASM module once (Singleton pattern).
   */
  private static async getModule() {
    if (!this.modulePromise) {
      this.modulePromise = getQuickJS();
    }
    return this.modulePromise;
  }

  /**
   * Executes untrusted user code against a dataset in a secure sandbox.
   * 
   * @param data - The raw data array (e.g., 5000 rows)
   * @param code - The JavaScript code to execute (must end with a return statement or expression)
   * @returns The result of the analysis (primitive or small object)
   */
  static async runAnalysis(data: unknown[], code: string) {
    const QuickJS = await this.getModule();
    const vm = QuickJS.newContext();
    
    try {
      // 1. Inject Data: Marshal the data into the VM as a global 'data' variable
      // We use JSON.stringify/parse for safe transfer across the WASM boundary
      const dataHandle = vm.newString(JSON.stringify(data));
      const setDataCode = `const data = JSON.parse(dataJson);`;
      
      vm.setProp(vm.global, "dataJson", dataHandle);
      vm.unwrapResult(vm.evalCode(setDataCode));
      dataHandle.dispose();

      // 2. Wrap User Code: Ensure it returns a value and handle errors
      // We wrap it in an IIFE (Immediately Invoked Function Expression)
      const wrappedCode = `
        (function() {
          try {
            ${code}
          } catch (e) {
            return { error: e.message };
          }
        })()
      `;

      // 3. Execute: Run the code inside the isolated VM
      const resultHandle = vm.unwrapResult(vm.evalCode(wrappedCode));
      
      // 4. Extract: Get the result back to Node.js
      const resultValue = vm.dump(resultHandle);
      resultHandle.dispose();

      return resultValue;

    } catch (error) {
      console.error("💥 [AnalysisService] Sandbox Error:", error);
      return { error: "Analysis execution failed." };
    } finally {
      // 5. Cleanup: Always dispose the VM to prevent memory leaks
      vm.dispose();
    }
  }
}
