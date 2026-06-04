package com.example.portfolio.mapper;

import com.example.portfolio.dto.ItemsDto;
import com.example.portfolio.model.Items;

public class ItemsMapper {

    public static ItemsDto mapToItemsDto(Items items){
        return new ItemsDto(
            items.getId(),
            items.getProductName(),
            items.getProductPrice(),
            items.getCategory(),
            items.getSection(),
            items.getStocks(),
            items.getImageUrl()
        );
    }

    public static Items mapToItems(ItemsDto itemsDto){
        return new Items(
            itemsDto.getId(),
            itemsDto.getProductName(),
            itemsDto.getProductPrice(),
            itemsDto.getCategory(),
            itemsDto.getSection(),
            itemsDto.getStocks(),
            itemsDto.getImageUrl()
        );
    }
}
