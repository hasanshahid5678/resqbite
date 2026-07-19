import math
from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


def pagination_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
) -> tuple[int, int]:
    return page, page_size


def build_page(items: list[T], total: int, page: int, page_size: int) -> Page[T]:
    return Page(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if page_size else 1,
    )