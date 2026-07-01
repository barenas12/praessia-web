-- Script para crear la tabla supply_recharge en MySQL

CREATE TABLE IF NOT EXISTS supply_recharge (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fecha DATE NOT NULL,
  insumo VARCHAR(255) NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  unidad VARCHAR(50) NOT NULL,
  costo DECIMAL(10, 2) DEFAULT 0,
  proveedor VARCHAR(255) NOT NULL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fecha (fecha),
  INDEX idx_insumo (insumo),
  INDEX idx_proveedor (proveedor)
);
