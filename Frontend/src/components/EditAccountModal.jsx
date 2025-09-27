// components/EditAccountModal.jsx
import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import axios from "axios";

const EditAccountModal = ({ account, onClose, onReload }) => {
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
  });

  useEffect(() => {
    if (account) {
      setForm({
        email: account.email || "",
        first_name: account.first_name || "",
        last_name: account.last_name || "",
      });
    }
  }, [account]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSave = async () => {
  console.log("Save button clicked");
  console.log("Saving data:", form);

  try {
    const response = await axios.post(
      `http://localhost:8000/api/accounts/${account.id}`,
      {
        ...form,
        _method: "PUT", // Laravel-style method override
      }
    );

    console.log("Update response:", response.data);
    onReload();
    onClose();
  } catch (error) {
    console.error("Error updating account:", error);
  }
};


  return (
    <Modal show={!!account} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAccountModal;
