import { useState, useCallback, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { api } from "../../../utils/api";
import type { Vendor, Unit, CreateOrderData, Order } from "../../../types";
import AppLayout from "../../core/AppLayout";
import ComboBox from "../../core/ComboBox";

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unit_cost: string;
}

function CreateOrderPage() {
  const history = useHistory();
  const { id: orderId } = useParams<{ id?: string }>();
  const isEditMode = Boolean(orderId);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: "", unit_cost: "" },
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorModalError, setVendorModalError] = useState("");
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorContactInfo, setNewVendorContactInfo] = useState("");
  const [newUnitNumber, setNewUnitNumber] = useState("");

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      setIsLoading(true);
      const response = await api.getOrder(orderId);
      setIsLoading(false);
      if (response.error || !response.data) {
        setError(response.error || "Failed to load order");
        return;
      }
      const order = response.data as Order;
      setVendor(
        order.vendor
          ? ({ ...order.vendor, label: order.vendor.name } as Vendor & {
              label: string;
            })
          : null
      );
      setUnit(
        order.unit
          ? ({
              ...order.unit,
              label: `${order.unit.unit_number}${
                order.unit.description ? ` - ${order.unit.description}` : ""
              }`,
            } as Unit & { label: string })
          : null
      );
      setDescription(order.description);
      setNotes(order.notes ?? "");
      setItems(
        order.items?.length
          ? order.items.map((item, idx) => ({
              id: String(idx + 1),
              description: item.description,
              quantity: String(item.quantity ?? ""),
              unit_cost: String(item.unit_cost ?? ""),
            }))
          : [{ id: "1", description: "", quantity: "", unit_cost: "" }]
      );
    };
    load();
  }, [orderId]);

  const searchVendors = useCallback(async (query: string) => {
    const response = await api.searchVendors(query);
    if (response.data) {
      return (response.data as Vendor[]).map((v) => ({ ...v, label: v.name }));
    }
    return [];
  }, []);

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

  const handleCreateVendor = async () => {
    setVendorModalError("");
    if (!newVendorName.trim()) {
      setVendorModalError("Vendor name is required");
      return;
    }
    if (!newVendorContactInfo.trim()) {
      setVendorModalError("Contact info is required");
      return;
    }

    const response = await api.createVendorQuick(
      newVendorName.trim(),
      newVendorContactInfo.trim()
    );
    if (response.data) {
      const newVendor = response.data as Vendor;
      setVendor({ ...newVendor, label: newVendor.name } as Vendor & {
        label: string;
      });
      setShowVendorModal(false);
      setNewVendorName("");
      setNewVendorContactInfo("");
    } else if (response.error) {
      setVendorModalError(response.error);
    }
  };

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

  const addLineItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", quantity: "", unit_cost: "" },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      return sum + qty * cost;
    }, 0);
  };

  const getRequiredFieldsError = useCallback((): string | null => {
    if (!vendor) return "Please select a vendor";
    if (!unit) return "Please select a unit";
    if (!description.trim()) return "Please enter a description";
    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) return "Please add at least one line item";
    return null;
  }, [vendor, unit, description, items]);

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

    const data: CreateOrderData = {
      vendor_id: vendor!.id,
      unit_id: unit!.id,
      description: description.trim(),
      notes: notes.trim() || null,
      items: validItems.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity ? parseFloat(item.quantity) : null,
        unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : null,
      })),
    };

    if (isEditMode && orderId) {
      const response = await api.updateOrder(orderId, data);
      if (response.error) {
        setError(response.error);
        setIsSubmitting(false);
        return;
      }
      if (submitForApproval) {
        const submitResponse = await api.submitOrder(orderId);
        if (submitResponse.error) {
          setError(submitResponse.error);
          setIsSubmitting(false);
          return;
        }
      }
      history.push(`/order/${orderId}`);
      return;
    }

    const response = await api.createOrder(data);
    if (response.error) {
      setError(response.error);
      setIsSubmitting(false);
      return;
    }
    if (submitForApproval && response.data) {
      const order = response.data as { id: string };
      const submitResponse = await api.submitOrder(order.id);
      if (submitResponse.error) {
        setError(submitResponse.error);
        setIsSubmitting(false);
        return;
      }
    }
    history.push("/");
  };

  if (isEditMode && isLoading) {
    return (
      <AppLayout>
        <div className="loading">Loading order...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="create-order-page">
        <div className="card">
          <div className="card__header">
            <h1 className="card__title">
              {isEditMode ? "Edit Order" : "New Order"}
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
            <label className="form-group__label">Vendor *</label>
            <ComboBox
              value={vendor ? { ...vendor, label: vendor.name } : null}
              onChange={(v) => setVendor(v)}
              onSearch={searchVendors}
              onCreateNew={(name) => {
                setNewVendorName(name);
                setVendorModalError("");
                setShowVendorModal(true);
              }}
              allowCreate
              createLabel="Create new vendor"
              placeholder="Search vendors..."
            />
            {vendor?.contact_info && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginTop: "0.5rem",
                  whiteSpace: "pre-line",
                }}
              >
                {vendor.contact_info}
              </p>
            )}
          </div>

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
              placeholder="Search units (vehicle, trailer, location)..."
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Description *</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this order for?"
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Notes (optional)</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Line Items</label>
            <div className="line-item-inputs">
              {items.map((item, index) => (
                <div key={item.id} className="line-item-input">
                  {/* Mobile header: line number + remove button */}
                  <div className="line-item-input__mobile-header">
                    <span className="line-item-input__mobile-number">
                      Item {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="btn btn--link"
                      style={{ color: "#dc2626", padding: "0.25rem" }}
                      disabled={items.length === 1}
                    >
                      Remove
                    </button>
                  </div>

                  {/* Desktop line number */}
                  <span className="line-item-input__number line-item-input__desktop-only">
                    {index + 1}.
                  </span>

                  {/* Description input */}
                  <input
                    type="text"
                    className="form-input line-item-input__description"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, "description", e.target.value)
                    }
                    placeholder="Item description"
                  />

                  {/* Mobile row for qty, cost, total */}
                  <div className="line-item-input__mobile-row">
                    <div className="line-item-input__mobile-field">
                      <label>Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.id, "quantity", e.target.value)
                        }
                        placeholder="Qty"
                        step="0.01"
                      />
                    </div>
                    <div className="line-item-input__mobile-field">
                      <label>Unit Cost</label>
                      <input
                        type="number"
                        className="form-input"
                        value={item.unit_cost}
                        onChange={(e) =>
                          updateLineItem(item.id, "unit_cost", e.target.value)
                        }
                        placeholder="Cost"
                        step="0.01"
                      />
                    </div>
                    <div className="line-item-input__mobile-field">
                      <label>Total</label>
                      <span className="line-item-input__total">
                        {item.quantity && item.unit_cost
                          ? `$${(
                              parseFloat(item.quantity) *
                              parseFloat(item.unit_cost)
                            ).toFixed(2)}`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Desktop qty input */}
                  <input
                    type="number"
                    className="form-input line-item-input__quantity line-item-input__desktop-only"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(item.id, "quantity", e.target.value)
                    }
                    placeholder="Qty"
                    step="0.01"
                  />

                  {/* Desktop unit cost input */}
                  <input
                    type="number"
                    className="form-input line-item-input__unit-cost line-item-input__desktop-only"
                    value={item.unit_cost}
                    onChange={(e) =>
                      updateLineItem(item.id, "unit_cost", e.target.value)
                    }
                    placeholder="Unit cost"
                    step="0.01"
                  />

                  {/* Desktop total */}
                  <span className="line-item-input__total line-item-input__desktop-only">
                    {item.quantity && item.unit_cost
                      ? `$${(
                          parseFloat(item.quantity) * parseFloat(item.unit_cost)
                        ).toFixed(2)}`
                      : "-"}
                  </span>

                  {/* Desktop remove button */}
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="btn btn--link line-item-input__desktop-only"
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
              onClick={addLineItem}
              className="btn btn--secondary btn--sm"
              style={{ marginTop: "0.75rem" }}
            >
              + Add Line Item
            </button>
          </div>

          {calculateTotal() > 0 && (
            <div
              style={{
                textAlign: "right",
                fontSize: "1.125rem",
                fontWeight: "600",
                marginTop: "1rem",
                padding: "1rem",
                background: "#f9fafb",
                borderRadius: "0.375rem",
              }}
            >
              Total: ${calculateTotal().toFixed(2)}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() =>
                history.push(isEditMode && orderId ? `/order/${orderId}` : "/")
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

      {showVendorModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowVendorModal(false);
            setVendorModalError("");
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Create New Vendor</h2>
              <button
                className="modal__close"
                onClick={() => {
                  setShowVendorModal(false);
                  setVendorModalError("");
                }}
              >
                ×
              </button>
            </div>
            <div className="form-group">
              <label className="form-group__label">Vendor Name *</label>
              <input
                type="text"
                className="form-input"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                autoFocus
              />
            </div>
            {vendorModalError && (
              <div
                className="form-group__error"
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "#fef2f2",
                  borderRadius: "0.375rem",
                }}
              >
                {vendorModalError}
              </div>
            )}
            <div className="form-group">
              <label className="form-group__label">Contact Info *</label>
              <textarea
                className="form-input"
                value={newVendorContactInfo}
                onChange={(e) => setNewVendorContactInfo(e.target.value)}
                placeholder="Phone, email, address, etc."
                rows={3}
                required
              />
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setShowVendorModal(false);
                  setVendorModalError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCreateVendor}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

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

export default CreateOrderPage;
