/**
 * Utility functions for branch/office normalization
 * Đảm bảo consistency giữa frontend và backend cho tất cả 21 quận
 */

/**
 * List of all 21 branches in HCMC (matching backend OfficeBranch enum)
 */
export const ALL_BRANCHES = [
  { enum: "D1", display: "Quận 1" },
  { enum: "DISTRICT3", display: "Quận 3" },
  { enum: "DISTRICT4", display: "Quận 4" },
  { enum: "DISTRICT5", display: "Quận 5" },
  { enum: "DISTRICT6", display: "Quận 6" },
  { enum: "DISTRICT7", display: "Quận 7" },
  { enum: "DISTRICT8", display: "Quận 8" },
  { enum: "DISTRICT10", display: "Quận 10" },
  { enum: "DISTRICT11", display: "Quận 11" },
  { enum: "DISTRICT12", display: "Quận 12" },
  { enum: "BINH_TAN", display: "Bình Tân" },
  { enum: "BINH_THANH", display: "Bình Thạnh" },
  { enum: "GO_VAP", display: "Gò Vấp" },
  { enum: "PHU_NHUAN", display: "Phú Nhuận" },
  { enum: "TAN_BINH", display: "Tân Bình" },
  { enum: "TAN_PHU", display: "Tân Phú" },
  { enum: "THU_DUC", display: "Thủ Đức" },
  { enum: "NHA_BE", display: "Nhà Bè" },
  { enum: "CAN_GIO", display: "Cần Giờ" },
  { enum: "CU_CHI", display: "Củ Chi" },
  { enum: "HOC_MON", display: "Hóc Môn" },
];

/**
 * Validate if branch is supported
 * @param {string} branchName - Branch name (enum or display)
 * @returns {boolean} - True if valid
 */
export const isValidBranch = (branchName) => {
  if (!branchName) return false;

  const normalized = normalizeBranchToEnum(branchName);
  return ALL_BRANCHES.some((b) => b.enum === normalized);
};

/**
 * Normalize branch name to enum format
 * "Bình Thạnh" → "BINH_THANH"
 * "Quận 1" → "D1"
 * "Gò Vấp" → "GO_VAP"
 *
 * @param {string} branchName - Vietnamese branch name
 * @returns {string} - Normalized enum name
 * @throws {Error} - If branch is invalid
 */
export const normalizeBranchToEnum = (branchName) => {
  if (!branchName || typeof branchName !== "string") {
    throw new Error("Branch name is required and must be a string");
  }

  // Remove Vietnamese diacritics and convert to uppercase
  const normalized = branchName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/đ/gi, "d") // Replace đ/Đ
    .replace(/\s+/g, "_") // Space to underscore
    .toUpperCase();

  // Special mapping for districts
  const districtMapping = {
    QUAN_1: "D1",
    QUAN_3: "DISTRICT3",
    QUAN_4: "DISTRICT4",
    QUAN_5: "DISTRICT5",
    QUAN_6: "DISTRICT6",
    QUAN_7: "DISTRICT7",
    QUAN_8: "DISTRICT8",
    QUAN_10: "DISTRICT10",
    QUAN_11: "DISTRICT11",
    QUAN_12: "DISTRICT12",
  };

  const result = districtMapping[normalized] || normalized;

  // Validate result
  if (!ALL_BRANCHES.some((b) => b.enum === result)) {
    console.error(`Invalid branch: "${branchName}" normalized to "${result}"`);
    throw new Error(
      `Branch "${branchName}" is not one of the 21 supported HCMC districts`
    );
  }

  return result;
};

/**
 * Denormalize enum to Vietnamese display name
 * "BINH_THANH" → "Bình Thạnh"
 * "D1" → "Quận 1"
 * "GO_VAP" → "Gò Vấp"
 *
 * @param {string} enumName - Enum branch name
 * @returns {string} - Vietnamese display name
 */
export const denormalizeBranchFromEnum = (enumName) => {
  if (!enumName) return null;

  const branch = ALL_BRANCHES.find((b) => b.enum === enumName);
  return branch ? branch.display : enumName;
};
