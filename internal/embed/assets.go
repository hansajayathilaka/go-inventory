package embed

import (
	"embed"
	"io/fs"
)

// EmbedReactApp embeds the React application build files
// Note: This embed directive is only active when the files exist
//
//go:embed all:frontend/dist
var reactBuildFiles embed.FS

// GetReactFiles returns a filesystem containing the React build files
func GetReactFiles() fs.FS {
	// Return the subdirectory containing the actual files
	reactFS, err := fs.Sub(reactBuildFiles, "frontend/dist")
	if err != nil {
		// Fallback to the root if subdirectory doesn't exist (development mode)
		return reactBuildFiles
	}
	return reactFS
}