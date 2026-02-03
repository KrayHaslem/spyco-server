import { useState, useEffect, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import { api } from "../../../utils/api";
import type { POGroup, Order } from "../../../types";

interface EditableLineItem {
  id: string;
  description: string;
  quantity: string;
  unit_cost: string;
}

function POGroupDetailPage() {
  const { id: poGroupId } = useParams<{ id?: string }>();
  const history = useHistory();
  const isEditMode = Boolean(poGroupId);

  const [poGroup, setPOGroup] = useState<POGroup | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [poNumber, setPONumber] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Order detail modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editableItems, setEditableItems] = useState<EditableLineItem[]>([]);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadPOGroup = useCallback(async () => {
    if (!poGroupId) return;

    setIsLoading(true);
    const response = await api.getPOGroup(poGroupId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      const data = response.data as POGroup;
      setPOGroup(data);
      setPONumber(data.po_number);
    }
    setIsLoading(false);
  }, [poGroupId]);

  const loadAvailableOrders = useCallback(async () => {
    const response = await api.getAvailableOrdersForPOGroup();
    if (response.data) {
      setAvailableOrders(response.data as Order[]);
    }
  }, []);

  useEffect(() => {
    if (isEditMode) {
      loadPOGroup();
    }
    loadAvailableOrders();
  }, [isEditMode, loadPOGroup, loadAvailableOrders]);

  const handleCreate = async () => {
    setError("");

    if (!poNumber.trim()) {
      setError("PO number is required");
      return;
    }

    setIsSaving(true);
    const response = await api.createPOGroup(poNumber.trim());

    if (response.error) {
      setError(response.error);
      setIsSaving(false);
      return;
    }

    const newPOGroup = response.data as POGroup;

    // If orders were selected, add them
    if (selectedOrderIds.length > 0) {
      const addResponse = await api.addOrdersToPOGroup(
        newPOGroup.id,
        selectedOrderIds
      );
      if (addResponse.error) {
        setError(addResponse.error);
        setIsSaving(false);
        return;
      }
    }

    history.push("/admin/po-groups");
  };

  const handleUpdatePONumber = async () => {
    if (!poGroup) return;
    setError("");

    if (!poNumber.trim()) {
      setError("PO number is required");
      return;
    }

    if (poNumber.trim() === poGroup.po_number) return;

    setIsSaving(true);
    const response = await api.updatePOGroup(poGroup.id, poNumber.trim());

    if (response.error) {
      setError(response.error);
      setIsSaving(false);
      return;
    }

    await loadPOGroup();
    setIsSaving(false);
  };

  const handleAddOrders = async () => {
    if (!poGroup || selectedOrderIds.length === 0) return;

    setIsSaving(true);
    const response = await api.addOrdersToPOGroup(poGroup.id, selectedOrderIds);

    if (response.error) {
      setError(response.error);
      setIsSaving(false);
      return;
    }

    setSelectedOrderIds([]);
    await loadPOGroup();
    await loadAvailableOrders();
    setIsSaving(false);
  };

  const handleRemoveOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!poGroup) return;
    if (!confirm("Remove this order from the PO Group?")) return;

    const response = await api.removeOrderFromPOGroup(poGroup.id, orderId);

    if (response.error) {
      setError(response.error);
      return;
    }

    await loadPOGroup();
    await loadAvailableOrders();
  };

  const handleDelete = async () => {
    if (!poGroup) return;
    if (!confirm("Are you sure you want to delete this PO Group?")) return;

    const response = await api.deletePOGroup(poGroup.id);

    if (response.error) {
      setError(response.error);
      return;
    }

    history.push("/admin/po-groups");
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Order detail modal handlers
  const openOrderModal = async (order: Order) => {
    // Fetch full order details
    const response = await api.getOrder(order.id);
    if (response.error) {
      setError(response.error);
      return;
    }
    const fullOrder = response.data as Order;
    setSelectedOrder(fullOrder);
    setIsEditingItems(false);
    setModalError("");
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
    setIsEditingItems(false);
    setEditableItems([]);
    setModalError("");
  };

  const startEditingItems = () => {
    if (!selectedOrder?.items) return;
    setEditableItems(
      selectedOrder.items.map((item, idx) => ({
        id: String(idx + 1),
        description: item.description,
        quantity: item.quantity !== null ? String(item.quantity) : "",
        unit_cost: item.unit_cost !== null ? String(item.unit_cost) : "",
      }))
    );
    setIsEditingItems(true);
  };

  const cancelEditingItems = () => {
    setIsEditingItems(false);
    setEditableItems([]);
    setModalError("");
  };

  const updateEditableItem = (
    id: string,
    field: keyof EditableLineItem,
    value: string
  ) => {
    setEditableItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addEditableItem = () => {
    setEditableItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", quantity: "", unit_cost: "" },
    ]);
  };

  const removeEditableItem = (id: string) => {
    if (editableItems.length === 1) return;
    setEditableItems((prev) => prev.filter((item) => item.id !== id));
  };

  const saveEditedItems = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    setModalError("");

    const validItems = editableItems.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      setModalError("At least one line item is required");
      setIsSaving(false);
      return;
    }

    const response = await api.adminUpdateOrderItems(
      selectedOrder.id,
      validItems.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity ? parseFloat(item.quantity) : null,
        unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : null,
      }))
    );

    if (response.error) {
      setModalError(response.error);
      setIsSaving(false);
      return;
    }

    // Update the selected order with new data
    const updatedOrder = (response.data as { order: Order }).order;
    setSelectedOrder(updatedOrder);
    setIsEditingItems(false);
    setEditableItems([]);

    // Reload PO Group to get updated totals
    await loadPOGroup();
    setIsSaving(false);
  };

  const handleMarkPaid = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    setModalError("");

    const response = await api.markOrderPaid(selectedOrder.id);

    if (response.error) {
      setModalError(response.error);
      setIsSaving(false);
      return;
    }

    const updatedOrder = (response.data as { order: Order }).order;
    setSelectedOrder(updatedOrder);
    await loadPOGroup();
    setIsSaving(false);
  };

  const calculateEditableTotal = () => {
    return editableItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      return sum + qty * cost;
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isEditMode && isLoading) {
    return <div className="loading">Loading PO Group...</div>;
  }

  return (
    <div className="po-group-detail-page">
      <div className="card">
        <div className="card__header">
          <h1 className="card__title">
            {isEditMode
              ? `PO Group: ${poGroup?.po_number || ""}`
              : "New PO Group"}
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
          <label className="form-group__label">
            PO Number (from accounting system) *
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="form-input"
              value={poNumber}
              onChange={(e) => setPONumber(e.target.value)}
              placeholder="Enter the PO number from your accounting system"
              style={{ maxWidth: "400px" }}
            />
            {isEditMode && (
              <button
                className="btn btn--secondary"
                onClick={handleUpdatePONumber}
                disabled={isSaving || poNumber === poGroup?.po_number}
              >
                Update
              </button>
            )}
          </div>
        </div>

        {isEditMode && poGroup && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "#f9fafb",
                borderRadius: "0.375rem",
                maxWidth: "400px",
              }}
            >
              <div>
                <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  Total Orders
                </span>
                <p style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                  {poGroup.order_count}
                </p>
              </div>
              <div>
                <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  Total Amount
                </span>
                <p style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                  {formatCurrency(poGroup.total)}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                }}
              >
                Orders in this PO Group
              </h3>

              {poGroup.orders && poGroup.orders.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Description</th>
                      <th>Vendor</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poGroup.orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => openOrderModal(order)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <strong>{order.order_number}</strong>
                        </td>
                        <td>{order.description}</td>
                        <td>{order.vendor?.name || "-"}</td>
                        <td>
                          <span
                            className={`status-badge status-badge--${order.status}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>{formatCurrency(order.total)}</td>
                        <td>
                          <button
                            className="btn btn--link btn--sm"
                            style={{ color: "#dc2626" }}
                            onClick={(e) => handleRemoveOrder(order.id, e)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#6b7280",
                    background: "#f9fafb",
                    borderRadius: "0.375rem",
                  }}
                >
                  No orders in this PO Group yet
                </div>
              )}
            </div>
          </>
        )}

        {/* Available Orders to Add */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              marginBottom: "0.75rem",
            }}
          >
            {isEditMode ? "Add Orders to PO Group" : "Select Orders to Add"}
          </h3>

          {availableOrders.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#6b7280",
                background: "#f9fafb",
                borderRadius: "0.375rem",
              }}
            >
              No approved orders available to add
            </div>
          ) : (
            <>
              <div
                style={{
                  maxHeight: "300px",
                  overflow: "auto",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                  marginBottom: "0.75rem",
                }}
              >
                {availableOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid #e5e7eb",
                      cursor: "pointer",
                      background: selectedOrderIds.includes(order.id)
                        ? "#eff6ff"
                        : "transparent",
                    }}
                    onClick={() => toggleOrderSelection(order.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginRight: "1rem" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "500" }}>
                        {order.order_number}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {order.description} • {order.vendor?.name}
                      </div>
                    </div>
                    <div style={{ fontWeight: "500" }}>
                      {formatCurrency(order.total)}
                    </div>
                  </div>
                ))}
              </div>

              {isEditMode && selectedOrderIds.length > 0 && (
                <button
                  className="btn btn--primary"
                  onClick={handleAddOrders}
                  disabled={isSaving}
                >
                  Add {selectedOrderIds.length} Order
                  {selectedOrderIds.length !== 1 ? "s" : ""}
                </button>
              )}
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            className="btn btn--secondary"
            onClick={() => history.push("/admin/po-groups")}
          >
            {isEditMode ? "Back" : "Cancel"}
          </button>

          {!isEditMode && (
            <button
              className="btn btn--primary"
              onClick={handleCreate}
              disabled={isSaving || !poNumber.trim()}
            >
              {isSaving ? "Creating..." : "Create PO Group"}
            </button>
          )}

          {isEditMode && poGroup && (
            <button
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={poGroup.order_count > 0}
              title={
                poGroup.order_count > 0
                  ? "Remove all orders before deleting"
                  : ""
              }
            >
              Delete PO Group
            </button>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderModal}>
          <div
            className="modal modal--large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "800px" }}
          >
            <div className="modal__header">
              <div>
                <h2 className="modal__title">{selectedOrder.order_number}</h2>
                <span
                  className={`status-badge status-badge--${selectedOrder.status}`}
                  style={{ marginTop: "0.25rem" }}
                >
                  {selectedOrder.status.toUpperCase()}
                </span>
              </div>
              <button className="modal__close" onClick={closeOrderModal}>
                ×
              </button>
            </div>

            {modalError && (
              <div
                className="form-group__error"
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "#fef2f2",
                  borderRadius: "0.375rem",
                }}
              >
                {modalError}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Vendor
                </span>
                <p style={{ fontWeight: "500" }}>
                  {selectedOrder.vendor?.name || "-"}
                </p>
              </div>
              <div>
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Unit
                </span>
                <p style={{ fontWeight: "500" }}>
                  {selectedOrder.unit?.unit_number || "None"}
                </p>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Description
                </span>
                <p style={{ fontWeight: "500" }}>{selectedOrder.description}</p>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <h3 style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                  Line Items
                </h3>
                {!isEditingItems && (
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={startEditingItems}
                  >
                    Edit Items
                  </button>
                )}
              </div>

              {isEditingItems ? (
                /* Editing Mode */
                <div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {editableItems.map((item, index) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            width: "20px",
                            paddingTop: "0.5rem",
                            color: "#9ca3af",
                            fontSize: "0.875rem",
                          }}
                        >
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 2, fontSize: "0.875rem" }}
                          value={item.description}
                          onChange={(e) =>
                            updateEditableItem(
                              item.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Item description"
                        />
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: "80px", fontSize: "0.875rem" }}
                          value={item.quantity}
                          onChange={(e) =>
                            updateEditableItem(
                              item.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          placeholder="Qty"
                          step="0.01"
                        />
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: "100px", fontSize: "0.875rem" }}
                          value={item.unit_cost}
                          onChange={(e) =>
                            updateEditableItem(
                              item.id,
                              "unit_cost",
                              e.target.value
                            )
                          }
                          placeholder="Unit $"
                          step="0.01"
                        />
                        <span
                          style={{
                            width: "80px",
                            paddingTop: "0.5rem",
                            textAlign: "right",
                            color: "#6b7280",
                            fontSize: "0.875rem",
                          }}
                        >
                          {item.quantity && item.unit_cost
                            ? `$${(
                                parseFloat(item.quantity) *
                                parseFloat(item.unit_cost)
                              ).toFixed(2)}`
                            : "-"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEditableItem(item.id)}
                          className="btn btn--link"
                          style={{
                            color: "#dc2626",
                            padding: "0.25rem 0.5rem",
                            fontSize: "1rem",
                          }}
                          disabled={editableItems.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addEditableItem}
                    className="btn btn--secondary btn--sm"
                    style={{ marginBottom: "0.75rem" }}
                  >
                    + Add Line Item
                  </button>

                  {calculateEditableTotal() > 0 && (
                    <div
                      style={{
                        textAlign: "right",
                        fontSize: "1rem",
                        fontWeight: "600",
                        padding: "0.75rem",
                        background: "#f9fafb",
                        borderRadius: "0.375rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Total: ${calculateEditableTotal().toFixed(2)}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={cancelEditingItems}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={saveEditedItems}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Items"}
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div>
                  <table className="table" style={{ fontSize: "0.875rem" }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th style={{ textAlign: "right" }}>Qty</th>
                        <th style={{ textAlign: "right" }}>Unit Cost</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td>{item.line_number}</td>
                          <td>{item.description}</td>
                          <td style={{ textAlign: "right" }}>
                            {item.quantity ?? "-"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {item.unit_cost != null
                              ? `$${Number(item.unit_cost).toFixed(2)}`
                              : "-"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {item.total != null
                              ? `$${Number(item.total).toFixed(2)}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td
                          colSpan={4}
                          style={{ textAlign: "right", fontWeight: "600" }}
                        >
                          Total:
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "600" }}>
                          {formatCurrency(selectedOrder.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal__footer">
              {selectedOrder.status === "approved" && (
                <button
                  className="btn btn--primary"
                  onClick={handleMarkPaid}
                  disabled={isSaving}
                >
                  {isSaving ? "Processing..." : "Mark as Paid"}
                </button>
              )}
              <button className="btn btn--secondary" onClick={closeOrderModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default POGroupDetailPage;
