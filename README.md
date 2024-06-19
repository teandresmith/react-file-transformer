# useFileTransformer hook

The proposed hook provides a straightforward method to transform or re-map file headers to align with the application's required headers. This functionality allows users to upload files with varying header names while enabling the application to process them internally before sending them to the backend. Currently, the output file format is restricted to CSV. The following MIME types are supported:

- "text/csv"
- "application/vnd.ms-excel"
- "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
- "text/xml"

**Note: XML files can have a maximum depth of two levels, including the root element. See the example below for further clarification.**

Example 1

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<root>
    <row> <!-- The name of the first level node can be anything as it only parsed as a separator -->
      <name>te</name>
      <id>1</id>
    </row>
    <row>
      <name>te</name>
      <id>3</id>
    </row>
    <row>
      <name>te</name>
      <id>2</id>
    </row>
</root>
```

Example 2

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<root>
    <0> <!-- The name of the first level node can be anything as it only parsed as a separator -->
      <make>Honda</make>
      <model>Civic</model>
      <year>1997</year>
      <id>1</id>
    </0>
    <1>
      <make>Ford</make>
      <model>Fusion</model>
      <year>2015</year>
      <id>2</id>
    </1>
    <2>
      <make>Dodge</make>
      <model>Dart</model>
      <year>2011</year>
      <id>3</id>
    </2>
</root>
```

## Install

react-file-transformer is available on npm and can be installed by using one of the following commands.

```bash
npm install react-file-transformer
```

```bash
yarn add react-file-transformer
```

## Usage

Below is a basic example of using the react-file-transformer hook. For a more in-depth example, please see the [demo](https://teandresmith.github.io/react-file-transformer/).

```tsx
import { useFileTransformer } from "react-file-transformer";

export function Component() {
  const { onChange, transform } = useFileTransformer();

  const mapping = [
    {
      source: "id",
      target: "user_id",
    },
  ];

  async function handleClick(e) {
    await transform(mapping);
  }

  return (
    <>
      <input
        type="file"
        onChange={onChange}
        accept="text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/xml"
      />
      <button onClick={handleClick}>Transform</button>
    </>
  );
}
```

## Demo

To see a more in-depth example of how to use react-file-transformer, see the following:

- [Demo](https://teandresmith.github.io/react-file-transformer/)
- [Src](./src/App.tsx)
