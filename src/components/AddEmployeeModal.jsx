import { useState } from "react";
import axios from "axios";

function AddEmployeeModal({ onClose, onSuccess }) {

  const [employee, setEmployee] = useState({

    "EMPLOYEE NUMBER": "",
    "EMPLOYEE NAME": "",
    "DESIGNATION": "",
    "MANAGER ID": "",
    "DATE OF JOINING": "",
    "EMAIL ADDRESS": "",
    "LOCATION": "",
    "RESOURCE COUNTRY": "",
    "RESOURCE ONSITE OFFSHORE": "",
    "ONSITE OFFSHORE NEARSHORE": "",
    "CLIENT LOCATION": "",
    "EMP_WORK_LOCATION": "",
    "FROM_DATE": "",
    "GENDER": "Male"

  });

  const changeHandler = (e) => {

    setEmployee({

      ...employee,

      [e.target.name]: e.target.value

    });

  };

  const saveEmployee = async () => {

    try {

      await axios.post(

        "http://127.0.0.1:8000/employees",

        employee

      );

      alert("Employee Added");

      onSuccess();

    }

    catch (err) {

      console.log(err);

      alert("Unable to add employee");

    }

  };

  return (

    <div className="modal-overlay">

      <div className="modal">

        <h2>Add Employee</h2>

        {
          Object.keys(employee).map((key) => (

            <div
              className="info-row"
              key={key}
            >

              <label>{key}</label>

              <input

                name={key}

                value={employee[key]}

                onChange={changeHandler}

              />

            </div>

          ))
        }

        <div className="modal-buttons">

          <button
            className="view-btn"
            onClick={saveEmployee}
          >
            Save
          </button>

          <button
            className="close-btn"
            onClick={onClose}
          >
            Cancel
          </button>

        </div>

      </div>

    </div>

  );

}

export default AddEmployeeModal;