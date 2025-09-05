package embed

import (
	"embed"
	"io/fs"
)

// EmbedReactApp embeds the React application build files
// Note: This embed directive is only active when the files exist
//
// Placeholder for React build files - embed disabled during development
var reactBuildFiles embed.FS

// GetReactFiles returns a filesystem containing the React build files
// Currently returns empty filesystem during development
func GetReactFiles() fs.FS {
	// During development, return empty filesystem
	// TODO: Re-enable embed when React build is available
	return reactBuildFiles
}