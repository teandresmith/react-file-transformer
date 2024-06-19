import {
  Box,
  Button,
  Container,
  Fieldset,
  Group,
  rem,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  List,
  Affix,
  Drawer,
  ActionIcon,
} from "@mantine/core";
import { useFileTransformer, ColumnMap } from "../";
import { Dropzone } from "@mantine/dropzone";
import {
  IconPhoto,
  IconPlus,
  IconRowRemove,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { FormEvent, useEffect, useState } from "react";
import { CodeHighlight } from "@mantine/code-highlight";
import { useDisclosure } from "@mantine/hooks";
import Papa from "papaparse";

function App() {
  const {
    onChange,
    files,
    setFiles,
    transform,
    transformedFiles,
    clear,
    headers,
    importHeaders,
  } = useFileTransformer();

  const [mapped, setMapped] = useState<ColumnMap[]>([
    { source: "", target: "" },
  ]);
  const [opened, { open, close }] = useDisclosure(false);

  const targetColumns = [
    {
      value: "id",
      label: "id",
    },
    {
      value: "zip_code",
      label: "zip_code",
    },
    {
      value: "type",
      label: "type",
    },
    {
      value: "model",
      label: "model",
    },
    {
      value: "make",
      label: "make",
    },
    {
      value: "email",
      label: "email",
    },
  ];

  useEffect(() => {
    if (headers.length !== 0) {
      setMapped(headers.map((value) => ({ source: value, target: "" })));
    }
  }, [headers]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clear();
    await transform(mapped);
  }

  function downloadCsv() {
    const dummyData = [
      {
        メール: "johndoe@example.com",
        id: 10,
        "Postal Code": 94212,
        "Registered Vehicle Type": "Toyota",
      },
      {
        メール: "janedoe@example.com",
        id: 99,
        "Postal Code": 12111,
        "Registered Vehicle Type": "Honda",
      },
      {
        メール: "smith3@example.com",
        id: 1056,
        "Postal Code": 91111,
        "Registered Vehicle Type": "Hyundai",
      },
      {
        メール: "johnjohnson@example.com",
        id: 10000,
        "Postal Code": 21891,
        "Registered Vehicle Type": "Dodge",
      },
      {
        メール: "benlivingston@example.com",
        id: 1,
        "Postal Code": 77712,
        "Registered Vehicle Type": "Ford",
      },
    ];
    const raw = Papa.unparse(dummyData, {
      header: true,
    });
    const file = new File([raw], "example-data.csv", {
      type: "text/csv",
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
  }

  return (
    <>
      <Container size={"xl"} mt={20}>
        <Title order={2}>Example of using the useFileTransformer hook</Title>
        <Text fs={"italic"} fw={500} mb={1} size="lg">
          Note: Only the following types of files can currently be accepted CSV,
          XML, and Excel.
        </Text>
        <Text>
          Below is an example that demonstrates what can be done with the
          useFileTransformer hook. There are five important components to
          highlight.
        </Text>
        <List withPadding>
          <List.Item>
            A column mapper component allows multiple entries. The text field
            input represents a column name in a file, and a select input
            represents an application-level attribute to which the column should
            be mapped.
          </List.Item>
          <List.Item>
            A drag-and-drop zone based on the react-dropzone library shows how
            the hook can be integrated with the popular React library.
          </List.Item>
          <List.Item>A native file input.</List.Item>
          <List.Item>
            A submit button that triggers the file transformation.
          </List.Item>
          <List.Item>
            A button provides a convenient way of populating the column mapping
            component with all the available columns in the provided file. This
            allows you to quickly map your columns without having to manually
            type the names into the text field inputs.
          </List.Item>
        </List>
        <Box mb={5} mt={10}>
          <Fieldset legend="Column mapping" mb={10}>
            {mapped.map((value, index) => (
              <Group key={index} mt={index !== 0 ? 10 : 0}>
                <TextInput
                  placeholder="Your column name..."
                  w={250}
                  value={value.source}
                  onChange={(e) =>
                    setMapped((prev) =>
                      prev.map((v, i) => {
                        if (i === index) {
                          return {
                            source: e.target.value,
                            target: v.target,
                          };
                        }
                        return v;
                      })
                    )
                  }
                />
                <Select
                  placeholder="Pick one of our attributes"
                  w={250}
                  data={targetColumns.map((column) => ({
                    value: column.value,
                    label: column.label,
                    disabled: mapped.some(
                      (v) => v.target === column.value && column.value !== ""
                    ),
                  }))}
                  value={value.target}
                  onChange={(selectValue) =>
                    setMapped((prev) =>
                      prev.map((v, i) => {
                        if (i === index) {
                          return {
                            source: v.source,
                            target: selectValue ? selectValue : "",
                          };
                        }
                        return v;
                      })
                    )
                  }
                />
                <ActionIcon
                  color="cyan"
                  onClick={() => {
                    setMapped((prev) => prev.filter((_, i) => i !== index));
                  }}
                  disabled={mapped.length === 1}
                >
                  <IconRowRemove />
                </ActionIcon>
              </Group>
            ))}
            <Button
              mt={10}
              onClick={() =>
                setMapped((prev) => [...prev, { source: "", target: "" }])
              }
              variant="transparent"
              rightSection={<IconPlus size={14} />}
              color="cyan"
            >
              Add another column
            </Button>
          </Fieldset>
        </Box>
        <form onSubmit={onSubmit}>
          <Dropzone
            onDrop={(files) => {
              setFiles(files);
            }}
            onReject={(files) => console.log("rejected files", files)}
            maxSize={5 * 1024 ** 2}
            multiple
            mb={10}
            accept={[
              "text/xml",
              "text/csv",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "application/vnd.ms-excel",
            ]}
          >
            <Group
              justify="center"
              gap="xl"
              mih={220}
              style={{ pointerEvents: "none" }}
            >
              <Dropzone.Accept>
                <IconUpload
                  style={{
                    width: rem(52),
                    height: rem(52),
                    color: "var(--mantine-color-blue-6)",
                  }}
                  stroke={1.5}
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  style={{
                    width: rem(52),
                    height: rem(52),
                    color: "var(--mantine-color-red-6)",
                  }}
                  stroke={1.5}
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPhoto
                  style={{
                    width: rem(52),
                    height: rem(52),
                    color: "var(--mantine-color-dimmed)",
                  }}
                  stroke={1.5}
                />
              </Dropzone.Idle>

              <div>
                {transformedFiles.length !== 0 ? (
                  <Text size="xl" inline>
                    Your files have been transformed! See the table below to
                    compare results!
                  </Text>
                ) : files && files.length !== 0 ? (
                  <Text size="xl" inline>
                    You have files attached
                  </Text>
                ) : (
                  <>
                    <Text size="xl" inline>
                      Drag images here or click to select files
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                      Attach as many files as you like, each file should not
                      exceed 5mb
                    </Text>
                  </>
                )}
              </div>
            </Group>
          </Dropzone>
          <input
            type="file"
            name="file"
            onChange={onChange}
            accept="text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/xml"
          />
          <button type="submit">Submit</button>
        </form>
        <Button.Group mt={10} mb={20} orientation="vertical" w={400}>
          <Button variant="default" onClick={downloadCsv}>
            Don't have a CSV? Click me to download an example
          </Button>
          <Button
            onClick={() => {
              importHeaders();
            }}
            variant="default"
          >
            Choose your file and click me to import headers
          </Button>
        </Button.Group>

        {transformedFiles.map((value, index) => {
          const oldHeaders = Object.keys(value.originalData[0]);
          const newHeaders = Object.keys(value.transformedData[0]);

          return (
            <Group key={index} mt={20} mb={20}>
              <Table
                stickyHeader
                data={{
                  head: oldHeaders,
                  body: value.originalData
                    .slice(0, 100)
                    .map((v) => Object.values(v)),
                  caption: "data before the file manipulation",
                }}
                style={{ width: "45%" }}
              />
              <Table
                stickyHeader
                data={{
                  head: newHeaders,
                  body: value.transformedData
                    .slice(0, 100)
                    .map((v) => Object.values(v)),
                  caption: "Data after the file manipulation",
                }}
                style={{ width: "45%" }}
              />
            </Group>
          );
        })}

        <Drawer opened={opened} onClose={close} position="right" size={"xl"}>
          <CodeHighlight code={exampleCode} language="tsx" />
        </Drawer>
        <Affix position={{ bottom: 20, right: 20 }} zIndex={opened ? -1000 : 0}>
          <Button variant="gradient" color="cyan" onClick={open} radius={"xl"}>
            See code
          </Button>
        </Affix>
      </Container>
    </>
  );
}

const exampleCode = `
import {
  Box,
  Button,
  Container,
  Fieldset,
  Group,
  rem,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  List,
  Affix,
  Drawer,
  ActionIcon,
} from "@mantine/core";
import { useFileTransformer, ColumnMap } from "../";
import { Dropzone } from "@mantine/dropzone";
import {
  IconPhoto,
  IconPlus,
  IconRowRemove,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { FormEvent, useEffect, useState } from "react";
import { CodeHighlight } from "@mantine/code-highlight";
import { useDisclosure } from "@mantine/hooks";
import Papa from "papaparse";

function App() {
  const {
    onChange,
    files,
    setFiles,
    transform,
    transformedFiles,
    clear,
    headers,
    importHeaders,
  } = useFileTransformer();

  const [mapped, setMapped] = useState<ColumnMap[]>([
    { source: "", target: "" },
  ]);
  const [opened, { open, close }] = useDisclosure(false);

  const targetColumns = [
    {
      value: "id",
      label: "id",
    },
    {
      value: "zip_code",
      label: "zip_code",
    },
    {
      value: "type",
      label: "type",
    },
    {
      value: "model",
      label: "model",
    },
    {
      value: "make",
      label: "make",
    },
    {
      value: "email",
      label: "email",
    },
  ];

  useEffect(() => {
    if (headers.length !== 0) {
      setMapped(headers.map((value) => ({ source: value, target: "" })));
    }
  }, [headers]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clear();
    await transform(mapped);
  }

  function downloadCsv() {
    const dummyData = [
      {
        メール: "johndoe@example.com",
        id: 10,
        "Postal Code": 94212,
        "Registered Vehicle Type": "Toyota",
      },
      {
        メール: "janedoe@example.com",
        id: 99,
        "Postal Code": 12111,
        "Registered Vehicle Type": "Honda",
      },
      {
        メール: "smith3@example.com",
        id: 1056,
        "Postal Code": 91111,
        "Registered Vehicle Type": "Hyundai",
      },
      {
        メール: "johnjohnson@example.com",
        id: 10000,
        "Postal Code": 21891,
        "Registered Vehicle Type": "Dodge",
      },
      {
        メール: "benlivingston@example.com",
        id: 1,
        "Postal Code": 77712,
        "Registered Vehicle Type": "Ford",
      },
    ];
    const raw = Papa.unparse(dummyData, {
      header: true,
    });
    const file = new File([raw], "example-data.csv", {
      type: "text/csv",
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
  }

  return (
    <>
      <Container size={"xl"} mt={20}>
        <Title order={2}>Example of using the useFileTransformer hook</Title>
        <Text fs={"italic"} fw={500} mb={1} size="lg">
          Note: Only the following types of files can currently be accepted CSV,
          XML, and Excel.
        </Text>
        <Text>
          Below is an example that demonstrates what can be done with the
          useFileTransformer hook. There are five important components to
          highlight.
        </Text>
        <List withPadding>
          <List.Item>
            A column mapper component allows multiple entries. The text field
            input represents a column name in a file, and a select input
            represents an application-level attribute to which the column should
            be mapped.
          </List.Item>
          <List.Item>
            A drag-and-drop zone based on the react-dropzone library shows how
            the hook can be integrated with the popular React library.
          </List.Item>
          <List.Item>A native file input.</List.Item>
          <List.Item>
            A submit button that triggers the file transformation.
          </List.Item>
          <List.Item>
            A button provides a convenient way of populating the column mapping
            component with all the available columns in the provided file. This
            allows you to quickly map your columns without having to manually
            type the names into the text field inputs.
          </List.Item>
        </List>
        <Box mb={5} mt={10}>
          <Fieldset legend="Column mapping" mb={10}>
            {mapped.map((value, index) => (
              <Group key={index} mt={index !== 0 ? 10 : 0}>
                <TextInput
                  placeholder="Your column name..."
                  w={250}
                  value={value.source}
                  onChange={(e) =>
                    setMapped((prev) =>
                      prev.map((v, i) => {
                        if (i === index) {
                          return {
                            source: e.target.value,
                            target: v.target,
                          };
                        }
                        return v;
                      })
                    )
                  }
                />
                <Select
                  placeholder="Pick one of our attributes"
                  w={250}
                  data={targetColumns.map((column) => ({
                    value: column.value,
                    label: column.label,
                    disabled: mapped.some(
                      (v) => v.target === column.value && column.value !== ""
                    ),
                  }))}
                  value={value.target}
                  onChange={(selectValue) =>
                    setMapped((prev) =>
                      prev.map((v, i) => {
                        if (i === index) {
                          return {
                            source: v.source,
                            target: selectValue ? selectValue : "",
                          };
                        }
                        return v;
                      })
                    )
                  }
                />
                <ActionIcon
                  color="cyan"
                  onClick={() => {
                    setMapped((prev) => prev.filter((_, i) => i !== index));
                  }}
                  disabled={mapped.length === 1}
                >
                  <IconRowRemove />
                </ActionIcon>
              </Group>
            ))}
            <Button
              mt={10}
              onClick={() =>
                setMapped((prev) => [...prev, { source: "", target: "" }])
              }
              variant="transparent"
              rightSection={<IconPlus size={14} />}
              color="cyan"
            >
              Add another column
            </Button>
          </Fieldset>
        </Box>
        <form onSubmit={onSubmit}>
          <Dropzone
            onDrop={(files) => {
              setFiles(files);
            }}
            onReject={(files) => console.log("rejected files", files)}
            maxSize={5 * 1024 ** 2}
            multiple
            mb={10}
            accept={[
              "text/xml",
              "text/csv",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "application/vnd.ms-excel",
            ]}
          >
            <Group
              justify="center"
              gap="xl"
              mih={220}
              style={{ pointerEvents: "none" }}
            >
              <Dropzone.Accept>
                <IconUpload
                  style={{
                    width: rem(52),
                    height: rem(52),
                    color: "var(--mantine-color-blue-6)",
                  }}
                  stroke={1.5}
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  style={{
                    width: rem(52),
                    height: rem(52),
                    color: "var(--mantine-color-red-6)",
                  }}
                  stroke={1.5}
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPhoto
                  style={{
                    width: rem(52),
                    height: rem(52),
                    color: "var(--mantine-color-dimmed)",
                  }}
                  stroke={1.5}
                />
              </Dropzone.Idle>

              <div>
                {transformedFiles.length !== 0 ? (
                  <Text size="xl" inline>
                    Your files have been transformed! See the table below to
                    compare results!
                  </Text>
                ) : files && files.length !== 0 ? (
                  <Text size="xl" inline>
                    You have files attached
                  </Text>
                ) : (
                  <>
                    <Text size="xl" inline>
                      Drag images here or click to select files
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                      Attach as many files as you like, each file should not
                      exceed 5mb
                    </Text>
                  </>
                )}
              </div>
            </Group>
          </Dropzone>
          <input
            type="file"
            name="file"
            onChange={onChange}
            accept="text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/xml"
          />
          <button type="submit">Submit</button>
        </form>
        <Button.Group mt={10} mb={20} orientation="vertical" w={400}>
          <Button variant="default" onClick={downloadCsv}>
            Don't have a CSV? Click me to download an example
          </Button>
          <Button
            onClick={() => {
              importHeaders();
            }}
            variant="default"
          >
            Choose your file and click me to import headers
          </Button>
        </Button.Group>

        {transformedFiles.map((value, index) => {
          const oldHeaders = Object.keys(value.originalData[0]);
          const newHeaders = Object.keys(value.transformedData[0]);

          return (
            <Group key={index} mt={20} mb={20}>
              <Table
                stickyHeader
                data={{
                  head: oldHeaders,
                  body: value.originalData
                    .slice(0, 100)
                    .map((v) => Object.values(v)),
                  caption: "data before the file manipulation",
                }}
                style={{ width: "45%" }}
              />
              <Table
                stickyHeader
                data={{
                  head: newHeaders,
                  body: value.transformedData
                    .slice(0, 100)
                    .map((v) => Object.values(v)),
                  caption: "Data after the file manipulation",
                }}
                style={{ width: "45%" }}
              />
            </Group>
          );
        })}

        <Drawer opened={opened} onClose={close} position="right" size={"xl"}>
          <CodeHighlight code={exampleCode} language="tsx" />
        </Drawer>
        <Affix position={{ bottom: 20, right: 20 }} zIndex={opened ? -1000 : 0}>
          <Button variant="gradient" color="cyan" onClick={open} radius={"xl"}>
            See code
          </Button>
        </Affix>
      </Container>
    </>
  );
}
`;

export default App;
