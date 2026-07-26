import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import dagre from "dagre";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";

import EmployeeNode from "../components/EmployeeNode";
import AddEmployeeModal from "../components/AddEmployeeModal";
import EditEmployeeModel from "../components/EditEmployeeModel";

import "reactflow/dist/style.css";

const nodeTypes = {
  employee: EmployeeNode,
};

// ---------------- DAGRE ----------------

const nodeWidth = 240;
const nodeHeight = 150;

const getLayoutedElements = (nodes, edges) => {

  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: "TB",
    ranksep: 140,
    nodesep: 100,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {

    const position = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: position.x - nodeWidth / 2,
        y: position.y - nodeHeight / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
};

// ---------------- MANAGER IDS ----------------

function getAllManagerIds(employees, acc = new Set()) {

  employees.forEach((emp) => {

    if (emp.children && emp.children.length > 0) {

      acc.add(String(emp.id));

      getAllManagerIds(emp.children, acc);

    }

  });

  return acc;
}

// ---------------- SEARCH ----------------

function findEmployeePaths(
  employees,
  searchText,
  path = [],
  results = []
) {

  employees.forEach((emp) => {

    const currentPath = [...path, emp];

    const name = String(
      emp.employee["EMPLOYEE NAME"] || ""
    ).toLowerCase();

    const empNumber = String(
      emp.employee["EMPLOYEE NUMBER"] || ""
    ).toLowerCase();

    const search = searchText.toLowerCase();

    if (
      name.includes(search) ||
      empNumber.includes(search)
    ) {
      results.push(currentPath);
    }

    if (emp.children?.length) {

      findEmployeePaths(
        emp.children,
        searchText,
        currentPath,
        results
      );

    }

  });

  return results;
}

// ---------------- AVATAR ----------------

function getAvatar(employee) {

  const gender = employee["GENDER"];

  if (
    gender &&
    gender.toLowerCase() === "female"
  ) {
    return "https://cdn-icons-png.flaticon.com/512/6997/6997662.png";
  }

  return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
}

// =====================================================

function OrgChart() {

  // Upload

  const [file, setFile] = useState(null);

  // Backend Data

  const [rawData, setRawData] = useState([]);

  // ReactFlow

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [collapsedIds, setCollapsedIds] = useState(new Set());

  // Selected Employee

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Modals

  const [showModal, setShowModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  // Search

  const [searchText, setSearchText] = useState("");

  const [highlightedEmployees, setHighlightedEmployees] =
    useState([]);

  // ===================================================
  // Upload Excel
  // ===================================================

  const uploadExcel = async () => {

    if (!file) {

      alert("Please select an Excel file");

      return;

    }

    const formData = new FormData();

    formData.append("file", file);

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/upload-org",
        formData
      );

      setRawData(response.data);

      setCollapsedIds(
        getAllManagerIds(response.data)
      );

      setSelectedEmployee(null);

      setHighlightedEmployees([]);

      setShowModal(false);

      setSearchText("");

    }

    catch (err) {

      console.log(err);

      alert("Upload Failed");

    }

  };

  // ===================================================
  // Refresh Hierarchy
  // ===================================================

  const refreshHierarchy = async () => {

    try {

      const response = await axios.get(
        "http://127.0.0.1:8000/hierarchy"
      );

      setRawData(response.data);

    }

    catch (err) {

      console.log(err);

    }

  };

  // ===================================================
  // Delete Employee
  // ===================================================

  const deleteEmployee = async () => {

    if (!selectedEmployee) return;

    const ok = window.confirm(

      `Delete ${selectedEmployee["EMPLOYEE NAME"]}?`

    );

    if (!ok) return;

    try {

      await axios.delete(

        `http://127.0.0.1:8000/employees/${selectedEmployee["EMPLOYEE NUMBER"]}`

      );

      await refreshHierarchy();

      setSelectedEmployee(null);

      setShowModal(false);

    }

    catch (err) {

      console.log(err);

      alert("Unable to delete employee");

    }

  };

  // ===================================================
  // Search Employee
  // ===================================================

  const searchEmployee = () => {

    if (!searchText.trim()) {

      alert("Enter employee name or employee number");

      return;

    }

    const paths = findEmployeePaths(
      rawData,
      searchText
    );

    if (paths.length === 0) {

      alert("Employee not found");

      return;

    }

    const collapsed = getAllManagerIds(rawData);

    const highlighted = [];

    let firstEmployee = null;

    paths.forEach((path) => {

      path.forEach((emp) => {

        collapsed.delete(String(emp.id));

      });

      const employee = path[path.length - 1].employee;

      highlighted.push(

        String(employee["EMPLOYEE NUMBER"])

      );

      if (!firstEmployee) {

        firstEmployee = employee;

      }

    });

    setCollapsedIds(collapsed);

    setHighlightedEmployees(highlighted);

    setSelectedEmployee(firstEmployee);

  };
    // ===================================================
  // Build Visible Tree
  // ===================================================

  const buildVisibleTree = useCallback(

    (employees, parent, nodeArray, edgeArray) => {

      employees.forEach((emp) => {

        const idStr = String(emp.id);

        const hasChildren =
          emp.children &&
          emp.children.length > 0;

        const isCollapsed =
          collapsedIds.has(idStr);

        nodeArray.push({

          id: idStr,

          type: "employee",

          data: {

            employee: emp.employee,

            hasChildren,

            isCollapsed,

            childCount: hasChildren
              ? emp.children.length
              : 0,

            avatar: getAvatar(emp.employee),

            highlighted:
              highlightedEmployees.includes(
                String(
                  emp.employee["EMPLOYEE NUMBER"]
                )
              ),

          },

          position: { x: 0, y: 0 },

        });

        if (parent) {

          edgeArray.push({

            id: `${parent}-${emp.id}`,

            source: String(parent),

            target: idStr,

            type: "smoothstep",

            animated: true,

            style: {
              stroke: "#1976d2",
              strokeWidth: 3,
            },

          });

        }

        if (
          hasChildren &&
          !isCollapsed
        ) {

          buildVisibleTree(
            emp.children,
            emp.id,
            nodeArray,
            edgeArray
          );

        }

      });

    },

    [
      collapsedIds,
      highlightedEmployees,
    ]

  );

  // ===================================================
  // Layout whenever hierarchy changes
  // ===================================================

  useEffect(() => {

    if (rawData.length === 0) {

      setNodes([]);

      setEdges([]);

      return;

    }

    const nodeArray = [];

    const edgeArray = [];

    buildVisibleTree(
      rawData,
      null,
      nodeArray,
      edgeArray
    );

    const layout =
      getLayoutedElements(
        nodeArray,
        edgeArray
      );

    setNodes(layout.nodes);

    setEdges(layout.edges);

  }, [
    rawData,
    collapsedIds,
    buildVisibleTree,
  ]);

  // ===================================================
  // Node Click
  // ===================================================

  const handleNodeClick = (
    event,
    node
  ) => {

    setSelectedEmployee({

      id:
        node.data.employee[
          "EMPLOYEE NUMBER"
        ],

      name:
        node.data.employee[
          "EMPLOYEE NAME"
        ],

      ...node.data.employee,

    });

    if (node.data.hasChildren) {

      setCollapsedIds((prev) => {

        const next = new Set(prev);

        if (next.has(node.id)) {

          next.delete(node.id);

        }

        else {

          next.add(node.id);

        }

        return next;

      });

    }

  };

  // ===================================================
  // Double Click
  // ===================================================

  const handleNodeDoubleClick = (
    event,
    node
  ) => {

    setSelectedEmployee(
      node.data.employee
    );

    setShowModal(true);

  };

  // ===================================================
  // Expand / Collapse
  // ===================================================

  const expandAll = () => {

    setCollapsedIds(new Set());

  };

  const collapseAll = () => {

    setCollapsedIds(
      getAllManagerIds(rawData)
    );

  };

  // ===================================================
  // JSX Starts
  // ===================================================

  return (

    <div className="app-container">

      {/* Header */}

      <header className="header">

        <div>

          <h1>
            🏢 Organization Hierarchy Dashboard
          </h1>

          <p>
            Upload an Excel file to visualize your organization structure.
          </p>

        </div>

        <div className="header-profile">

          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="admin"
          />

          <div>

            <h3>HR Admin</h3>

            <span>
              Organization Management
            </span>

          </div>

        </div>

      </header>

      {/* Upload Section */}

      <div className="upload-section">

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) =>
            setFile(e.target.files[0])
          }
        />

        <button
          onClick={uploadExcel}
        >
          Upload Excel
        </button>

        {rawData.length > 0 && (

          <>

            <button
              className="secondary-btn"
              onClick={expandAll}
            >
              Expand All
            </button>

            <button
              className="secondary-btn"
              onClick={collapseAll}
            >
              Collapse All
            </button>

            <input
              type="text"
              placeholder="Search employee..."
              value={searchText}
              onChange={(e) =>
                setSearchText(
                  e.target.value
                )
              }
            />

            <button
              className="secondary-btn"
              onClick={searchEmployee}
            >
              Search
            </button>

          </>

        )}

      </div>

      {/* Dashboard */}

      <div className="dashboard">

        {/* Left */}

        <div className="flow-card">

          <div className="card-header">

            🌳 Organization Hierarchy

          </div>

          <div className="flow-wrapper">

            <ReactFlow

              nodes={nodes}

              edges={edges}

              nodeTypes={nodeTypes}

              fitView

              fitViewOptions={{
                padding: 0.4,
              }}

              defaultEdgeOptions={{
                type: "smoothstep",
                animated: true,
                style: {
                  stroke: "#1976d2",
                  strokeWidth: 3,
                },
              }}

              onNodeClick={
                handleNodeClick
              }

              onNodeDoubleClick={
                handleNodeDoubleClick
              }

            >

              <Background
                variant="dots"
                gap={18}
                size={2}
              />

              <Controls />

              <MiniMap
                zoomable
                pannable
              />

            </ReactFlow>

          </div>

        </div>
                {/* ================= RIGHT PANEL ================= */}

        <div className="details-card">

          <h2>👤 Employee Details</h2>

          {selectedEmployee ? (

            <>

              <img
                src={getAvatar(selectedEmployee)}
                alt="employee"
                className="profile-image"
              />

              <div className="detail">
                <span>Name</span>
                <h3>{selectedEmployee["EMPLOYEE NAME"]}</h3>
              </div>

              <div className="detail">
                <span>Employee Number</span>
                <h3>{selectedEmployee["EMPLOYEE NUMBER"]}</h3>
              </div>

              {selectedEmployee["DESIGNATION"] && (

                <div className="detail">
                  <span>Designation</span>
                  <h3>{selectedEmployee["DESIGNATION"]}</h3>
                </div>

              )}

              {selectedEmployee["LOCATION"] && (

                <div className="detail">
                  <span>Location</span>
                  <h3>{selectedEmployee["LOCATION"]}</h3>
                </div>

              )}

              <button
                className="view-btn"
                onClick={() => setShowModal(true)}
              >
                View Full Profile
              </button>

              <button
                className="view-btn"
                onClick={() => setShowAddModal(true)}
              >
                Add Employee
              </button>

              <button
                className="view-btn"
                onClick={() => setShowEditModal(true)}
              >
                Edit Employee
              </button>

              <button
                className="delete-btn"
                onClick={deleteEmployee}
              >
                Delete Employee
              </button>

            </>

          ) : (

            <div className="empty-state">

              <img
                src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
                alt="empty"
              />

              <h3>No Employee Selected</h3>

              <p>
                Click any employee node to see details.
              </p>

              <p>
                Click a manager again to expand/collapse
                their team.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* ================= PROFILE MODAL ================= */}

      {showModal && selectedEmployee && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <img
                src={getAvatar(selectedEmployee)}
                alt="profile"
                className="modal-profile"
              />

              <div>

                <h2>
                  {selectedEmployee["EMPLOYEE NAME"]}
                </h2>

                <p>
                  {selectedEmployee["DESIGNATION"] ||
                    "Employee"}
                </p>

              </div>

            </div>

            <hr />

            <div className="modal-body">

              {Object.keys(selectedEmployee).map((key) => (

                <div
                  className="info-row"
                  key={key}
                >

                  <strong>{key}</strong>

                  <span>

                    {selectedEmployee[key]
                      ? String(selectedEmployee[key])
                      : "-"}

                  </span>

                </div>

              ))}

            </div>

            <button
              className="close-btn"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>

          </div>

        </div>

      )}

      {/* ================= ADD EMPLOYEE MODAL ================= */}

      {showAddModal && (

        <AddEmployeeModal

          onClose={() =>
            setShowAddModal(false)
          }

          onSuccess={() => {

            refreshHierarchy();

            setShowAddModal(false);

          }}

        />

      )}

      {/* ================= EDIT EMPLOYEE MODAL ================= */}

      {showEditModal && selectedEmployee && (

        <EditEmployeeModel

          employee={selectedEmployee}

          onClose={() =>
            setShowEditModal(false)
          }

          onSuccess={() => {

            refreshHierarchy();

            setShowEditModal(false);

          }}

        />

      )}

    </div>

  );

}

export default OrgChart;