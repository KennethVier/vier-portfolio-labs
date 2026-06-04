package com.portfolio.shop.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.shop.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBySectionIgnoreCase(String section);

    List<Product> findByCategoryIgnoreCase(String category);

    List<Product> findByCategoryIgnoreCaseAndSectionIgnoreCase(String category, String section);
}