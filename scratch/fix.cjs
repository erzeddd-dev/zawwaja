const fs = require('fs');

let code = fs.readFileSync('c:\\Users\\enemmz_\\Documents\\Zawwaja.id-Wedd-Plan-main\\src\\components\\Preparation.tsx', 'utf8');

code = code.replace('} from "lucide-react";', '} from "lucide-react";\nimport { PreparationRow } from "./PreparationRow";');
code = code.replace('export default function Preparation({', 'export default React.memo(function Preparation({');
code = code.replace(/}\s*$/, '});\n');
code = code.replace('const handleToggleCheck = async (item: WeddingChecklistItem, field: "cpp" | "cpw") => {', 'const handleToggleCheck = React.useCallback(async (item: WeddingChecklistItem, field: "cpp" | "cpw") => {');
code = code.replace(/await onSaveItem\(updatedItem\);\s*};/g, 'await onSaveItem(updatedItem);\n  }, [onSaveItem]);');
code = code.replace('const handleCostChange = async (item: WeddingChecklistItem, value: string, type: "estimate" | "actual") => {', 'const handleCostChange = React.useCallback(async (item: WeddingChecklistItem, value: string, type: "estimate" | "actual") => {');
code = code.replace(/await onSaveItem\(updated\);\s*};/g, 'await onSaveItem(updated);\n  }, [onSaveItem]);');

const startStr = '{catItems.map((item) => {';
const endStr = '                      })}';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{catItems.map((item) => (
                        <PreparationRow
                          key={item.id}
                          item={item}
                          isEditing={editingTaskId === item.id}
                          isAdministrasi={isAdministrasi}
                          isUpdating={isUpdating}
                          onSaveItem={onSaveItem}
                          onDeleteItem={onDeleteItem}
                          handleToggleCheck={handleToggleCheck}
                          setEditingTaskId={setEditingTaskId}
                          handleCostChange={handleCostChange}
                        />
                      ))}`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex + endStr.length);
}

fs.writeFileSync('c:\\Users\\enemmz_\\Documents\\Zawwaja.id-Wedd-Plan-main\\src\\components\\Preparation.tsx', code);
console.log('Modified successfully');
