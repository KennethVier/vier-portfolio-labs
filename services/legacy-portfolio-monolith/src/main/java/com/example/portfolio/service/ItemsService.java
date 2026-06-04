package com.example.portfolio.service;

import java.util.List;

import com.example.portfolio.dto.ItemsDto;

public interface ItemsService {

    ItemsDto addProduct(ItemsDto itemsDto);

    List<ItemsDto> getAllProducts();

    List<ItemsDto> getProductsBySection(String section);

    List<ItemsDto> getProductsByCategoryAndSection(String category, String section);


}
