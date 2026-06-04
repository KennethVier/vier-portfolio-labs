package com.example.portfolio.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.portfolio.model.Items;

public interface ItemsRepository extends JpaRepository<Items, Long>{
    
        List<Items> findBySection(String section);
        
        List<Items> findByCategoryAndSection(String category, String section);
}
