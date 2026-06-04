package com.example.portfolio.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.portfolio.dto.ItemsDto;
import com.example.portfolio.mapper.ItemsMapper;
import com.example.portfolio.model.Items;
import com.example.portfolio.repository.ItemsRepository;
import com.example.portfolio.service.ItemsService;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ItemsServiceImpl implements ItemsService{
    
    @Autowired
    ItemsRepository itemsRepository;

    @Override
    public ItemsDto addProduct(ItemsDto itemsDto){
        Items product = ItemsMapper.mapToItems(itemsDto);
        Items savedProduct = itemsRepository.save(product);

        return ItemsMapper.mapToItemsDto(savedProduct);
    }

    @Override
    public List<ItemsDto> getAllProducts() {
        List<Items> products = itemsRepository.findAll();

        return products.stream().map(
            (product) -> ItemsMapper.mapToItemsDto(product))
                .collect(Collectors.toList());
    }

    @Override
    public List<ItemsDto> getProductsBySection(String section) {
        List<Items> sectionProducts = itemsRepository.findBySection(section);

        return sectionProducts.stream().map(
            (product) -> ItemsMapper.mapToItemsDto(product))
                .collect(Collectors.toList());
    }

    @Override
    public List<ItemsDto> getProductsByCategoryAndSection(String category, String section) {
        List<Items> productsCategorySection = itemsRepository.findByCategoryAndSection(category, section);
        
        return productsCategorySection.stream().map(
            (product) -> ItemsMapper.mapToItemsDto(product))
                .collect(Collectors.toList());
    }

}




   



