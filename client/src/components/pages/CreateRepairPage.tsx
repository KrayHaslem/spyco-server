import { useState, useCallback, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { api } from "../../utils/api";
import type { Unit, CreateRepairData, Repair } from "../../types";
import AppLayout from "../core/AppLayout";
import ComboBox from "../core/ComboBox";

interface RepairItemInput {
  id: string;
  description: string;
}

function CreateRepairPage() {
  const history = useHistory();
  const { id: repairId } = useParams<{ id?: string }>();
  const isEditMode = Boolean(repairId);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RepairItemInput[]>([
    { id: "1", description: "" },
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newUnitNumber, setNewUnitNumber] = useState("");

  useEffect(() => {
    if (!repairId) return;
    const load = async () => {
      setIsLoading(true);
      const response = await api.getRepair(repairId);
      setIsLoading(false);
      if (response.error || !response.data) {
        setError(response.error || "Failed to load repair");
        return;
      }
      const repair = response.data as Repair;
      setUnit(
        repair.unit
          ? ({
              ...repair.unit,
              label: `${repair.unit.unit_number}${
                repair.unit.description ? ` - ${repair.unit.description}` : ""
              }`,
            } as Unit & { label: string })
          : null
      );
      setDescription(repair.description);
      setNotes(repair.notes ?? "");
      setItems(
        repair.items?.length
          ? repair.items.map((item, idx) => ({
              id: String(idx + 1),
              description: item.description,
            }))
          : [{ id: "1", description: "" }]
      );
    };
    load();
  }, [repairId]);

  const searchUnits = useCallback(async (query: string) => {
    const response = await api.searchUnits(query);
    if (response.data) {
      return (response.data as Unit[]).map((u) => ({
        ...u,
        label: `${u.unit_number}${u.description ? ` - ${u.description}` : ""}`,
      }));
    }
    return [];
  }, []);

  const handleCreateUnit = async () => {
    if (!newUnitNumber.trim()) return;

    const response = await api.createUnitQuick(newUnitNumber.trim());
    if (response.data) {
      const newUnit = response.data as Unit;
      setUnit({ ...newUnit, label: newUnit.unit_number } as Unit & {
        label: string;
      });
      setShowUnitModal(false);
      setNewUnitNumber("");
    }
  };

  const addRepairItem = () => {
    setItems((prev) => [...prev, { id: String(Date.now()), description: "" }]);
  };

  const removeRepairItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateRepairItem = (id: string, description: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description } : item))
    );
  };

  const getRequiredFieldsError = useCallback((): string | null => {
    if (!unit) return "Please select a unit";
    if (!description.trim()) return "Please enter a description";
    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) return "Please add at least one repair item";
    return null;
  }, [unit, description, items]);

  const handleSaveDraft = async () => {
    await handleSubmit(false);
  };

  const handleSubmitForApproval = async () => {
    await handleSubmit(true);
  };

  const handleSubmit = async (submitForApproval: boolean) => {
    setError("");

    const requiredError = getRequiredFieldsError();
    if (requiredError) {
      setError(requiredError);
      return;
    }

    const validItems = items.filter((item) => item.description.trim());
    setIsSubmitting(true);

    const data: CreateRepairData = {
      unit_id: unit!.id,
      description: description.trim(),
      notes: notes.trim() || null,
      items: validItems.map((item) => ({
        description: item.description.trim(),
      })),
    };

    if (isEditMode && repairId) {
      const response = await api.updateRepair(repairId, data);
      if (response.error) {
        setError(response.error);
        setIsSubmitting(false);
        return;
      }
      if (submitForApproval) {
        const submitResponse = await api.submitRepair(repairId);
        if (submitResponse.error) {
          setError(submitResponse.error);
          setIsSubmitting(false);
          return;
        }
      }
      history.push(`/repair/${repairId}`);
      return;
    }

    const response = await api.createRepair(data);
    if (response.error) {
      setError(response.error);
      setIsSubmitting(false);
      return;
    }
    if (submitForApproval && response.data) {
      const repair = response.data as { id: string };
      const submitResponse = await api.submitRepair(repair.id);
      if (submitResponse.error) {
        setError(submitResponse.error);
        setIsSubmitting(false);
        return;
      }
    }
    history.push("/repairs");
  };

  if (isEditMode && isLoading) {
    return (
      <AppLayout>
        <div className="loading">Loading repair...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="create-order-page">
        <div className="card">
          <div className="card__header">
            <h1 className="card__title">
              {isEditMode ? "Edit Repair" : "New Repair Request"}
            </h1>
          </div>

          {error && (
            <div
              className="form-group__error"
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "#fef2f2",
                borderRadius: "0.375rem",
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-group__label">Unit *</label>
            <ComboBox
              value={
                unit
                  ? {
                      ...unit,
                      label: `${unit.unit_number}${
                        unit.description ? ` - ${unit.description}` : ""
                      }`,
                    }
                  : null
              }
              onChange={(u) => setUnit(u)}
              onSearch={searchUnits}
              onCreateNew={(number) => {
                setNewUnitNumber(number);
                setShowUnitModal(true);
              }}
              allowCreate
              createLabel="Create new unit"
              placeholder="Search units (vehicle, trailer, equipment)..."
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Description *</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be repaired?"
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Notes (optional)</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or details..."
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Repair Items</label>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.75rem",
              }}
            >
              List the items or issues that need repair
            </p>
            <div className="repair-item-inputs">
              {items.map((item, index) => (
                <div key={item.id} className="repair-item-input">
                  <span className="repair-item-input__number">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    value={item.description}
                    onChange={(e) => updateRepairItem(item.id, e.target.value)}
                    placeholder="Describe the issue or item needing repair"
                  />
                  <button
                    type="button"
                    onClick={() => removeRepairItem(item.id)}
                    className="btn btn--link"
                    style={{ color: "#dc2626", padding: "0.5rem" }}
                    disabled={items.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRepairItem}
              className="btn btn--secondary btn--sm"
              style={{ marginTop: "0.75rem" }}
            >
              + Add Repair Item
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() =>
                history.push(
                  isEditMode && repairId ? `/repair/${repairId}` : "/repairs"
                )
              }
              className="btn btn--secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn btn--secondary"
              disabled={isSubmitting || !!getRequiredFieldsError()}
            >
              {isEditMode ? "Save Changes" : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={handleSubmitForApproval}
              className="btn btn--primary"
              disabled={isSubmitting || !!getRequiredFieldsError()}
            >
              {isSubmitting
                ? "Submitting..."
                : isEditMode
                ? "Save and Re-submit for Approval"
                : "Submit for Approval"}
            </button>
          </div>
        </div>
      </div>

      {showUnitModal && (
        <div className="modal-overlay" onClick={() => setShowUnitModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Create New Unit</h2>
              <button
                className="modal__close"
                onClick={() => setShowUnitModal(false)}
              >
                ×
              </button>
            </div>
            <div className="form-group">
              <label className="form-group__label">Unit Number</label>
              <input
                type="text"
                className="form-input"
                value={newUnitNumber}
                onChange={(e) => setNewUnitNumber(e.target.value)}
                placeholder="e.g., T-101, SHOP, V-2045"
                autoFocus
              />
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowUnitModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCreateUnit}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default CreateRepairPage;
