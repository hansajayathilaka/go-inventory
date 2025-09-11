import type { CategoryHierarchyNode } from '../types/inventory'

interface HierarchicalItem {
  id: string | number
  name: string
  level: number
  path: string
  parent_id?: string | number
  children?: HierarchicalItem[]
}

export function transformCategoryHierarchy(nodes: CategoryHierarchyNode[]): HierarchicalItem[] {
  return nodes.map((node) => ({
    id: node.category.id,
    name: node.category.name,
    level: node.category.level,
    path: node.category.path,
    parent_id: node.category.parent_id,
    children: node.children.length > 0 ? transformCategoryHierarchy(node.children) : undefined,
  }))
}

export function flattenCategoryHierarchy(nodes: CategoryHierarchyNode[]): { id: string; name: string; path: string }[] {
  const flattened: { id: string; name: string; path: string }[] = []
  
  function traverse(nodes: CategoryHierarchyNode[]) {
    for (const node of nodes) {
      flattened.push({
        id: node.category.id,
        name: node.category.name,
        path: node.category.path,
      })
      if (node.children.length > 0) {
        traverse(node.children)
      }
    }
  }
  
  traverse(nodes)
  return flattened
}