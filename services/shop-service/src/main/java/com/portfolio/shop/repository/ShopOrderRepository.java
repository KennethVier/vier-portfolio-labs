package com.portfolio.shop.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.shop.model.ShopOrder;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {

    List<ShopOrder> findTop25ByOrderByCreatedAtDesc();
}