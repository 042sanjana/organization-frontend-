import { Handle, Position } from "reactflow";
import "./EmployeeNode.css";

function EmployeeNode({ data }) {

  const { employee, hasChildren, isCollapsed, childCount } = data;

  const gender = employee["GENDER"];

  const avatar =
    gender &&
    gender.toLowerCase() === "female"
      ? "https://cdn-icons-png.flaticon.com/512/6997/6997662.png"
      : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
      console.log(employee["EMPLOYEE NAME"], data.highlighted);

  return (
    <div
  className={`employee-node
    ${hasChildren ? "has-children" : ""}
    ${data.highlighted ? "highlighted-node" : ""}
  `}
>

      <Handle
        type="target"
        position={Position.Top}
      />

      <img
        className="employee-avatar"
        src={avatar}
        alt="Employee"
      />

      <h4>{employee["EMPLOYEE NAME"]}</h4>

      <p>{employee["DESIGNATION"]}</p>

      {/* Expand / Collapse Badge */}
      {hasChildren && (
        <div
          className={`toggle-badge ${
            isCollapsed ? "collapsed" : "expanded"
          }`}
        >
          {isCollapsed ? `+${childCount}` : "−"}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
      />

    </div>
  );
}

export default EmployeeNode;