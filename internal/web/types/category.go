package types

// CategoryTreeNode represents a category in the tree view
type CategoryTreeNode struct {
	ID            string
	Name          string
	Description   string
	Level         int
	ChildrenCount int
	HasChildren   bool
}