import { useOutletContext } from "react-router-dom";

/**
 * @typedef {{
 *   user?: any;
 *   activeProfile?: any;
 *   onSwitchProfile?: (() => void) | undefined;
 *   isAdmin?: boolean;
 * }} AppOutletContext
 */

/**
 * Centralizes the shared layout outlet typing for JS pages.
 * @returns {AppOutletContext}
 */
export const useAppOutletContext = () => /** @type {AppOutletContext} */ (useOutletContext());
