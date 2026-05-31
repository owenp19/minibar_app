const { query } = require("./config/db");

const MODULES = {
  MINIBAR: "Minibares",
  LOSS: "Pérdidas",
  REPORT: "Reportes",
  RESTOCK: "Reposición",
  INVENTORY: "Inventario",
  PRODUCTS: "Productos",
  PROFILE: "Perfil",
  SETTINGS: "Configuración",
  AUTH: "Autenticación",
  ADMIN: "Admin"
};

const ACTION_TYPES = {
  LOGIN: "login",
  LOGOUT: "logout",
  CONSUMPTION_CREATED: "consumption_created",
  WHATSAPP_SENT: "whatsapp_sent",
  RESTOCK_CREATED: "restock_created",
  LOSS_CREATED: "loss_created",
  DAMAGE_CREATED: "damage_created",
  INVENTORY_ADJUSTED: "inventory_adjusted",
  ROOM_STATUS_CHANGED: "room_status_changed",
  REPORT_GENERATED: "report_generated",
  PDF_EXPORTED: "pdf_exported",
  EXCEL_EXPORTED: "excel_exported",
  PRODUCT_CREATED: "product_created",
  PRODUCT_UPDATED: "product_updated",
  PRODUCT_DISABLED: "product_disabled",
  PRICE_UPDATED: "price_updated",
  IDEAL_QTY_UPDATED: "ideal_qty_updated",
  PROFILE_UPDATED: "profile_updated",
  PROFILE_PHOTO_CHANGED: "profile_photo_changed",
  RECORD_VOIDED: "record_voided"
};

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || null;
}

function getDeviceInfo(req) {
  return req.headers["user-agent"] || null;
}

function getSessionUser(req) {
  if (req.session && req.session.user) {
    return req.session.user;
  }
  return null;
}

async function logAudit({
  userId,
  userName,
  userRole,
  moduleName,
  actionType,
  actionDescription,
  floorId,
  roomId,
  productId,
  previousData,
  newData,
  quantityBefore,
  quantityAfter,
  amount,
  ipAddress,
  deviceInfo,
  status = "success"
}) {
  try {
    const previousJson = previousData != null ? JSON.stringify(previousData) : null;
    const newJson = newData != null ? JSON.stringify(newData) : null;

    await query(
      `INSERT INTO audit_logs
       (user_id, user_name, user_role, module_name, action_type, action_description,
        floor_id, room_id, product_id, previous_data, new_data,
        quantity_before, quantity_after, amount, ip_address, device_info, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, userName, userRole, moduleName, actionType, actionDescription,
        floorId || null, roomId || null, productId || null,
        previousJson, newJson,
        quantityBefore != null ? quantityBefore : null,
        quantityAfter != null ? quantityAfter : null,
        amount != null ? amount : null,
        ipAddress || null, deviceInfo || null, status || "success"
      ]
    );
  } catch (err) {
    console.error("Error writing audit log:", err);
  }
}

function createAuditMiddleware(actionType, moduleName) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const user = getSessionUser(req);
      const status = res.statusCode >= 200 && res.statusCode < 300 ? "success" : "error";

      logAudit({
        userId: user?.id,
        userName: user?.fullName,
        userRole: user?.role,
        moduleName,
        actionType,
        actionDescription: typeof body?.message === "string" ? body.message : actionType,
        ipAddress: getClientIp(req),
        deviceInfo: getDeviceInfo(req),
        status
      });

      return originalJson(body);
    };
    next();
  };
}

module.exports = {
  logAudit,
  createAuditMiddleware,
  getSessionUser,
  getClientIp,
  getDeviceInfo,
  MODULES,
  ACTION_TYPES
};
