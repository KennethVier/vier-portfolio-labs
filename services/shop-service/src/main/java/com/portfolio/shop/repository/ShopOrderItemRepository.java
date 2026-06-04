package com.portfolio.shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.shop.model.ShopOrderItem;

public interface ShopOrderItemRepository extends JpaRepository<ShopOrderItem, Long> {
}