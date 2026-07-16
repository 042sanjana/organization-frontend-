import { useState } from "react";
import axios from "axios";

function EditEmployeeModel({

  employee,

  onClose,

  onSuccess

}) {

  const [formData, setFormData] = useState({

    ...employee

  });

  const changeHandler = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    });

  };

  const updateEmployee = async () => {

    try {

      await axios.put(

        `http://127.0.0.1:8000/employees/${employee["EMPLOYEE NUMBER"]}`,

        formData

      );

      alert("Employee Updated");

      onSuccess();

    }

    catch (err) {

      console.log(err);

      alert("Unable to update employee");

    }

  };

  return (

    <div className="modal-overlay">

      <div className="modal">

        <h2>Edit Employee</h2>

        {

          Object.keys(formData).map((key) => (

            <div

              className="info-row"

              key={key}

            >

              <label>{key}</label>

              <input

                name={key}

                value={formData[key] || ""}

                onChange={changeHandler}

                disabled={

                  key === "EMPLOYEE NUMBER"

                }

              />

            </div>

          ))

        }

        <div className="modal-buttons">

          <button

            className="view-btn"

            onClick={updateEmployee}

          >

            Update

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

export default EditEmployeeModel;